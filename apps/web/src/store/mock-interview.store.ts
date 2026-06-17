import { create } from 'zustand';
import type {
  InterviewConfig,
  InterviewSessionStatus,
  MockInterviewFeedback,
  TranscriptEntry,
} from '@elevatesde/shared-types';
import { useToastStore } from '@/store/toast.store';
import {
  createMicAnalyser,
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  type MicAnalyser,
  type SpeechSession,
} from '@/lib/speech';
import {
  generateFeedback,
  getFollowUp,
  getOpeningQuestion,
} from '@/lib/interview-engine';

interface MockInterviewState {
  status: InterviewSessionStatus;
  config: InterviewConfig | null;
  transcript: TranscriptEntry[];
  feedback: MockInterviewFeedback | null;
  isAiSpeaking: boolean;
  isMicActive: boolean;
  micLevel: number;
  remainingSeconds: number;
  answeredCount: number;
  speechSupported: boolean;
  start: (config: InterviewConfig) => void;
  toggleMic: () => Promise<void>;
  submitTypedAnswer: (text: string) => void;
  end: () => void;
  reset: () => void;
}

let timerId: ReturnType<typeof setInterval> | null = null;
let aiSpeakingId: ReturnType<typeof setTimeout> | null = null;
let micAnalyser: MicAnalyser | null = null;
let recognition: SpeechSession | null = null;
let levelFrame: number | null = null;
let liveEntryId: string | null = null;

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `interview-${Date.now()}-${Math.round(performance.now())}`;
}

function clearTimer(): void {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function clearAiSpeaking(): void {
  if (aiSpeakingId !== null) {
    clearTimeout(aiSpeakingId);
    aiSpeakingId = null;
  }
}

function stopLevelLoop(): void {
  if (levelFrame !== null) {
    cancelAnimationFrame(levelFrame);
    levelFrame = null;
  }
}

function teardownMic(): void {
  stopLevelLoop();
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
  if (micAnalyser) {
    micAnalyser.stop();
    micAnalyser = null;
  }
  liveEntryId = null;
}

export const useMockInterviewStore = create<MockInterviewState>((set, get) => {
  const speakQuestion = (text: string) => {
    const entry: TranscriptEntry = {
      id: newId(),
      speaker: 'AI',
      text,
      createdAt: new Date().toISOString(),
      isFinal: true,
    };
    set((state) => ({ transcript: [...state.transcript, entry], isAiSpeaking: true }));
    clearAiSpeaking();
    const words = text.split(/\s+/).filter(Boolean).length;
    const duration = Math.max(1500, Math.min(6000, words * 320));
    aiSpeakingId = setTimeout(() => {
      set({ isAiSpeaking: false });
      aiSpeakingId = null;
    }, duration);
  };

  const handleAnswer = (text: string) => {
    const { config, answeredCount } = get();
    if (!config) return;
    set({ answeredCount: answeredCount + 1 });
    const followUp = getFollowUp(config, answeredCount, text);
    setTimeout(() => {
      if (get().status === 'ACTIVE') {
        speakQuestion(followUp);
      }
    }, 700);
  };

  const handleSpeechResult = (text: string, isFinal: boolean) => {
    if (get().status !== 'ACTIVE') return;
    if (liveEntryId === null) {
      const id = newId();
      liveEntryId = id;
      const entry: TranscriptEntry = {
        id,
        speaker: 'CANDIDATE',
        text,
        createdAt: new Date().toISOString(),
        isFinal: false,
      };
      set((state) => ({ transcript: [...state.transcript, entry] }));
    } else {
      const id = liveEntryId;
      set((state) => ({
        transcript: state.transcript.map((entry) =>
          entry.id === id ? { ...entry, text, isFinal } : entry,
        ),
      }));
    }

    if (isFinal) {
      liveEntryId = null;
      handleAnswer(text);
    }
  };

  const runLevelLoop = () => {
    const tickLevel = () => {
      if (!micAnalyser) return;
      const next = micAnalyser.getLevel();
      const current = get().micLevel;
      if (Math.abs(next - current) > 0.03) {
        set({ micLevel: next });
      }
      levelFrame = requestAnimationFrame(tickLevel);
    };
    levelFrame = requestAnimationFrame(tickLevel);
  };

  return {
    status: 'IDLE',
    config: null,
    transcript: [],
    feedback: null,
    isAiSpeaking: false,
    isMicActive: false,
    micLevel: 0,
    remainingSeconds: 0,
    answeredCount: 0,
    speechSupported: true,

    start: (config) => {
      teardownMic();
      clearTimer();
      clearAiSpeaking();
      set({
        status: 'ACTIVE',
        config,
        transcript: [],
        feedback: null,
        isAiSpeaking: false,
        isMicActive: false,
        micLevel: 0,
        remainingSeconds: config.durationMinutes * 60,
        answeredCount: 0,
        speechSupported: isSpeechRecognitionSupported(),
      });
      speakQuestion(getOpeningQuestion(config));
      timerId = setInterval(() => {
        const remaining = get().remainingSeconds - 1;
        if (remaining <= 0) {
          set({ remainingSeconds: 0 });
          get().end();
        } else {
          set({ remainingSeconds: remaining });
        }
      }, 1000);
    },

    toggleMic: async () => {
      if (get().isMicActive) {
        teardownMic();
        set({ isMicActive: false, micLevel: 0 });
        return;
      }

      const session = createSpeechRecognition({
        onResult: handleSpeechResult,
        onError: (error) => {
          if (error === 'not-allowed' || error === 'service-not-allowed') {
            useToastStore
              .getState()
              .addToast('Microphone access was blocked. Enable it to answer by voice.', 'error');
            teardownMic();
            set({ isMicActive: false, micLevel: 0 });
          }
        },
      });

      if (!session) {
        set({ speechSupported: false });
        useToastStore
          .getState()
          .addToast('Voice input is not supported here. Type your answer instead.', 'info');
        return;
      }

      try {
        micAnalyser = await createMicAnalyser();
        runLevelLoop();
      } catch {
        micAnalyser = null;
      }

      try {
        session.start();
        recognition = session;
        set({ isMicActive: true });
      } catch {
        teardownMic();
        set({ isMicActive: false, micLevel: 0 });
        useToastStore
          .getState()
          .addToast('Could not start the microphone. Type your answer instead.', 'error');
      }
    },

    submitTypedAnswer: (text) => {
      const trimmed = text.trim();
      if (trimmed.length === 0 || get().status !== 'ACTIVE') return;
      const entry: TranscriptEntry = {
        id: newId(),
        speaker: 'CANDIDATE',
        text: trimmed,
        createdAt: new Date().toISOString(),
        isFinal: true,
      };
      set((state) => ({ transcript: [...state.transcript, entry] }));
      handleAnswer(trimmed);
    },

    end: () => {
      const { config, transcript, status } = get();
      if (status !== 'ACTIVE') return;
      teardownMic();
      clearTimer();
      clearAiSpeaking();
      const feedback = config ? generateFeedback(config, transcript) : null;
      set({
        status: 'COMPLETED',
        feedback,
        isAiSpeaking: false,
        isMicActive: false,
        micLevel: 0,
      });
      useToastStore.getState().addToast('Interview complete. Review your feedback below.', 'success');
    },

    reset: () => {
      teardownMic();
      clearTimer();
      clearAiSpeaking();
      set({
        status: 'IDLE',
        config: null,
        transcript: [],
        feedback: null,
        isAiSpeaking: false,
        isMicActive: false,
        micLevel: 0,
        remainingSeconds: 0,
        answeredCount: 0,
      });
    },
  };
});

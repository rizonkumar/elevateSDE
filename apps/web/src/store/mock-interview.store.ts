import { create } from 'zustand';
import type {
  InterviewConfig,
  InterviewSessionStatus,
  MockInterviewSessionDto,
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
  activeSessionIdFrom,
  answerMockInterview,
  endMockInterview,
  getActiveMockInterview,
  getMockInterview,
  mockInterviewErrorMessage,
  startMockInterview,
} from '@/lib/mock-interview-api';

const SCORING_POLL_MS = 2000;
const SCORING_POLL_LIMIT = 45;

interface MockInterviewState {
  status: InterviewSessionStatus;
  session: MockInterviewSessionDto | null;
  transcript: TranscriptEntry[];
  isHydrated: boolean;
  isStarting: boolean;
  isThinking: boolean;
  isAiSpeaking: boolean;
  isMicActive: boolean;
  micLevel: number;
  remainingSeconds: number;
  speechSupported: boolean;
  hydrate: () => Promise<void>;
  start: (config: InterviewConfig, preparationTaskId: string | null) => Promise<void>;
  toggleMic: () => Promise<void>;
  submitAnswer: (text: string) => Promise<void>;
  end: () => Promise<void>;
  reset: () => void;
}

let timerId: ReturnType<typeof setInterval> | null = null;
let aiSpeakingId: ReturnType<typeof setTimeout> | null = null;
let pollId: ReturnType<typeof setTimeout> | null = null;
let micAnalyser: MicAnalyser | null = null;
let recognition: SpeechSession | null = null;
let levelFrame: number | null = null;
let liveEntry: TranscriptEntry | null = null;
let pendingAnswer: TranscriptEntry | null = null;

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

function clearPoll(): void {
  if (pollId !== null) {
    clearTimeout(pollId);
    pollId = null;
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
  liveEntry = null;
}

function toast(message: string, kind: 'success' | 'error' | 'info'): void {
  useToastStore.getState().addToast(message, kind);
}

function secondsUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 1000));
}

function buildTranscript(session: MockInterviewSessionDto | null): TranscriptEntry[] {
  if (!session) return [];
  const entries = session.turns.flatMap((turn) => {
    const question: TranscriptEntry = {
      id: `${turn.id}-question`,
      speaker: 'AI',
      text: turn.question,
      createdAt: turn.askedAt,
      isFinal: true,
    };
    if (turn.answer === null) return [question];
    const answer: TranscriptEntry = {
      id: `${turn.id}-answer`,
      speaker: 'CANDIDATE',
      text: turn.answer,
      createdAt: turn.answeredAt ?? turn.askedAt,
      isFinal: true,
    };
    return [question, answer];
  });
  return [pendingAnswer, liveEntry].reduce<TranscriptEntry[]>(
    (all, entry) => (entry ? [...all, entry] : all),
    entries,
  );
}

function speakingDuration(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1500, Math.min(6000, words * 320));
}

export const useMockInterviewStore = create<MockInterviewState>((set, get) => {
  const refreshTranscript = () => set({ transcript: buildTranscript(get().session) });

  const announceQuestion = (question: string) => {
    clearAiSpeaking();
    set({ isAiSpeaking: true });
    aiSpeakingId = setTimeout(() => {
      set({ isAiSpeaking: false });
      aiSpeakingId = null;
    }, speakingDuration(question));
  };

  const startTimer = (deadlineAt: string) => {
    clearTimer();
    set({ remainingSeconds: secondsUntil(deadlineAt) });
    timerId = setInterval(() => {
      const remaining = secondsUntil(deadlineAt);
      set({ remainingSeconds: remaining });
      if (remaining <= 0) {
        clearTimer();
        if (!get().isThinking) void get().end();
      }
    }, 1000);
  };

  const pollScoring = (sessionId: string, attempt: number) => {
    clearPoll();
    pollId = setTimeout(() => {
      getMockInterview(sessionId)
        .then((latest) => {
          if (get().session?.id !== sessionId) return;
          applySession(latest);
          if (latest.status === 'SCORING' && attempt + 1 < SCORING_POLL_LIMIT) {
            pollScoring(sessionId, attempt + 1);
          }
        })
        .catch(() => {
          if (attempt + 1 < SCORING_POLL_LIMIT) pollScoring(sessionId, attempt + 1);
        });
    }, SCORING_POLL_MS);
  };

  const applySession = (session: MockInterviewSessionDto) => {
    const previous = get().session;
    const previousQuestionId = previous?.id === session.id ? previous.turns.at(-1)?.id : undefined;
    set({ session, status: session.status });
    refreshTranscript();

    if (session.status === 'ACTIVE') {
      startTimer(session.deadlineAt);
      const current = session.turns.at(-1);
      if (current && current.answer === null && current.id !== previousQuestionId) {
        announceQuestion(current.question);
      }
      return;
    }

    teardownMic();
    clearTimer();
    clearAiSpeaking();
    set({ isAiSpeaking: false, isMicActive: false, micLevel: 0 });
    if (session.status === 'SCORING' && previous?.status !== 'SCORING') {
      pollScoring(session.id, 0);
    }
    if (session.status === 'COMPLETED' && previous?.status === 'SCORING') {
      toast('Interview scored. Review your feedback below.', 'success');
    }
  };

  const resumeSession = async (sessionId: string) => {
    const session = await getMockInterview(sessionId);
    applySession(session);
  };

  const handleSpeechResult = (text: string, isFinal: boolean) => {
    if (get().status !== 'ACTIVE' || get().isThinking) return;
    liveEntry = {
      id: liveEntry?.id ?? `live-${Date.now()}`,
      speaker: 'CANDIDATE',
      text,
      createdAt: liveEntry?.createdAt ?? new Date().toISOString(),
      isFinal,
    };
    if (isFinal) {
      liveEntry = null;
      void get().submitAnswer(text);
      return;
    }
    refreshTranscript();
  };

  const runLevelLoop = () => {
    const tickLevel = () => {
      if (!micAnalyser) return;
      const next = micAnalyser.getLevel();
      if (Math.abs(next - get().micLevel) > 0.03) {
        set({ micLevel: next });
      }
      levelFrame = requestAnimationFrame(tickLevel);
    };
    levelFrame = requestAnimationFrame(tickLevel);
  };

  return {
    status: 'IDLE',
    session: null,
    transcript: [],
    isHydrated: false,
    isStarting: false,
    isThinking: false,
    isAiSpeaking: false,
    isMicActive: false,
    micLevel: 0,
    remainingSeconds: 0,
    speechSupported: true,

    hydrate: async () => {
      set({ speechSupported: isSpeechRecognitionSupported() });
      if (get().session) {
        set({ isHydrated: true });
        return;
      }
      try {
        const active = await getActiveMockInterview();
        if (active) applySession(active);
      } catch {
        toast('Could not check for an interview in progress.', 'error');
      } finally {
        set({ isHydrated: true });
      }
    },

    start: async (config, preparationTaskId) => {
      if (get().isStarting) return;
      teardownMic();
      clearPoll();
      pendingAnswer = null;
      set({ isStarting: true, speechSupported: isSpeechRecognitionSupported() });
      try {
        const session = await startMockInterview({
          ...config,
          ...(preparationTaskId ? { preparationTaskId } : {}),
        });
        applySession(session);
      } catch (error) {
        const activeId = activeSessionIdFrom(error);
        if (activeId) {
          toast('Resuming the interview you already have in progress.', 'info');
          await resumeSession(activeId).catch(() => undefined);
        } else {
          toast(mockInterviewErrorMessage(error, 'Could not start the interview.'), 'error');
        }
      } finally {
        set({ isStarting: false });
      }
    },

    toggleMic: async () => {
      if (get().isMicActive) {
        teardownMic();
        set({ isMicActive: false, micLevel: 0 });
        refreshTranscript();
        return;
      }

      const speech = createSpeechRecognition({
        onResult: handleSpeechResult,
        onError: (error) => {
          if (error === 'not-allowed' || error === 'service-not-allowed') {
            toast('Microphone access was blocked. Enable it to answer by voice.', 'error');
            teardownMic();
            set({ isMicActive: false, micLevel: 0 });
          }
        },
      });

      if (!speech) {
        set({ speechSupported: false });
        toast('Voice input is not supported here. Type your answer instead.', 'info');
        return;
      }

      try {
        micAnalyser = await createMicAnalyser();
        runLevelLoop();
      } catch {
        micAnalyser = null;
      }

      try {
        speech.start();
        recognition = speech;
        set({ isMicActive: true });
      } catch {
        teardownMic();
        set({ isMicActive: false, micLevel: 0 });
        toast('Could not start the microphone. Type your answer instead.', 'error');
      }
    },

    submitAnswer: async (text) => {
      const trimmed = text.trim();
      const { session, status, isThinking } = get();
      const current = session?.turns.at(-1);
      if (!session || status !== 'ACTIVE' || isThinking || !current || current.answer !== null) return;
      if (trimmed.length === 0) return;
      pendingAnswer = {
        id: `pending-${current.id}`,
        speaker: 'CANDIDATE',
        text: trimmed,
        createdAt: new Date().toISOString(),
        isFinal: true,
      };
      set({ isThinking: true });
      refreshTranscript();
      try {
        const next = await answerMockInterview(session, current.id, trimmed);
        pendingAnswer = null;
        applySession(next);
      } catch (error) {
        pendingAnswer = null;
        refreshTranscript();
        toast(mockInterviewErrorMessage(error, 'Your answer could not be submitted. Try again.'), 'error');
        await resumeSession(session.id).catch(() => undefined);
      } finally {
        set({ isThinking: false });
      }
    },

    end: async () => {
      const { session, status } = get();
      if (!session || status !== 'ACTIVE') return;
      teardownMic();
      clearTimer();
      try {
        applySession(await endMockInterview(session.id));
      } catch (error) {
        toast(mockInterviewErrorMessage(error, 'Could not end the interview.'), 'error');
        await resumeSession(session.id).catch(() => undefined);
      }
    },

    reset: () => {
      teardownMic();
      clearTimer();
      clearAiSpeaking();
      clearPoll();
      pendingAnswer = null;
      set({
        status: 'IDLE',
        session: null,
        transcript: [],
        isThinking: false,
        isAiSpeaking: false,
        isMicActive: false,
        micLevel: 0,
        remainingSeconds: 0,
      });
    },
  };
});

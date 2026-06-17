interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  readonly length: number;
  isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface SpeechWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

interface LegacyWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

function getRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const speechWindow = window as SpeechWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getRecognitionConstructor() !== null;
}

export interface SpeechSession {
  start(): void;
  stop(): void;
}

interface SpeechCallbacks {
  onResult: (text: string, isFinal: boolean) => void;
  onError: (error: string) => void;
}

export function createSpeechRecognition(callbacks: SpeechCallbacks): SpeechSession | null {
  const Recognition = getRecognitionConstructor();
  if (!Recognition) return null;

  const recognition = new Recognition();
  recognition.lang = 'en-US';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const alternative = result?.[0];
      if (!result || !alternative) continue;
      if (result.isFinal) {
        final += alternative.transcript;
      } else {
        interim += alternative.transcript;
      }
    }
    if (final.trim().length > 0) {
      callbacks.onResult(final.trim(), true);
    } else if (interim.trim().length > 0) {
      callbacks.onResult(interim.trim(), false);
    }
  };

  recognition.onerror = (event) => {
    callbacks.onError(event.error);
  };

  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
  };
}

export interface MicAnalyser {
  getLevel(): number;
  stop(): void;
}

export async function createMicAnalyser(): Promise<MicAnalyser> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const AudioContextCtor =
    window.AudioContext ?? (window as LegacyWindow).webkitAudioContext;
  if (!AudioContextCtor) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error('AudioContext is not supported in this browser.');
  }

  const context = new AudioContextCtor();
  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  const buffer = new Uint8Array(analyser.frequencyBinCount);

  return {
    getLevel: () => {
      analyser.getByteTimeDomainData(buffer);
      let sumSquares = 0;
      for (let index = 0; index < buffer.length; index += 1) {
        const centered = ((buffer[index] ?? 128) - 128) / 128;
        sumSquares += centered * centered;
      }
      const rms = Math.sqrt(sumSquares / buffer.length);
      return Math.min(1, rms * 2.4);
    },
    stop: () => {
      source.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      void context.close();
    },
  };
}

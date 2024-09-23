export interface Word {
  id: number;
  text: string;
  original: string;
  trailing: string;
  spoken: boolean;
  highlighted: boolean;
}

export interface Line {
  id: number;
  text: string;
  words: Word[];
  completed: boolean;
  active: boolean;
}

export interface RecognitionResult {
  text: string;
  partial?: boolean;
  confidence?: number;
}

export interface VoskModel {
  KaldiRecognizer(sampleRate: number): VoskRecognizer;
}

export interface VoskRecognizer {
  setWords(enable: boolean): void;
  acceptWaveform(samples: Int16Array): boolean;
  result(): RecognitionResult;
  partialResult(): RecognitionResult;
  finalResult(): RecognitionResult;
  startListening(): void;
  stopListening(): void;
}

export interface VoskSimpleAPI {
  createModel(modelPath: string | null): Promise<VoskModel>;
}

export interface PrompterConfig {
  confidenceThreshold: number;
  wordMatchThreshold: number;
  completionThreshold: number;
  scrollBehavior: ScrollBehavior;
}

export interface PrompterElements {
  startBtn: HTMLButtonElement;
  stopBtn: HTMLButtonElement;
  resetBtn: HTMLButtonElement;
  textInput: HTMLTextAreaElement;
  loadTextBtn: HTMLButtonElement;
  lyricsContent: HTMLDivElement;
  lyricsWrapper: HTMLDivElement;
  statusText: HTMLSpanElement;
  recognitionText: HTMLSpanElement;
  currentLineNumber: HTMLSpanElement;
  loadingOverlay: HTMLDivElement;
}

export type MessageType = 'success' | 'error' | 'info' | 'warning';
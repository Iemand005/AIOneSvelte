import type { GenerateStats } from "aione-web";

export type { GenerateStats };

export interface GenerateResult { content: string; stats: GenerateStats }

export type TtsDevice = "any" | "cpu" | "igpu" | "dgpu" | "accelerator";
export type TtsAudioType = "pcm" | "wav";

export interface TtsLoadOptions {
  threadCount?: number;
  flashAttention?: boolean;
  device?: TtsDevice;
}

export interface TtsProgressUpdate {
  stage: string;
  progress: number | null;
  elapsedSeconds?: string;
  frame?: number;
  model?: string;
  modelBytes?: number;
  mmproj?: string;
  mmprojBytes?: number;
}

export interface TtsVoice {
  referenceFile?: string;
  builtInName?: string;
  builtInIndex?: number;
}

export interface TtsSynthesisOptions {
  outputType?: TtsAudioType;
  voice?: TtsVoice;
  lang?: string;
  topK?: number;
  topP?: number;
  seed?: number;
  batchSize?: number;
  maxTokens?: number;
}

export interface TtsSynthesisStats {
  promptEvalMs: number;
  generationMs: number;
  conversionMs: number;
}

export interface TtsSynthesisResult {
  sampleRate: number;
  samples: number;
  audioType: TtsAudioType;
  audio: Uint8Array;
  stats: TtsSynthesisStats;
}

export type TtsModelSource =
  | { kind: "path"; modelPath: string; mmprojPath: string }
  | { kind: "file"; modelFile: File; mmprojFile: File };

export interface GenerateCallbacks {
  onToken?: (token: string, thinking: boolean) => void;
  onThinkingChange?: (thinking: boolean) => void;
  onPromptProgress?: (progress: number) => void;
  onGenerationStart?: () => void;
}

export interface ChatPromptMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type ModelSource =
  | { kind: "path"; path: string }
  | { kind: "file"; file: File }
  | { kind: "url"; url: string };

export interface LoadOptions {
  noHost?: boolean;
  contextLength?: number;
}

export interface GenerateOptions {
  maxTokens?: number;
  minP?: number;
  topK?: number;
  temperature?: number;
  seed?: number;
  callbacks?: GenerateCallbacks;
}

export interface Backend {
  readonly kind: "native" | "wasm";
  readonly canCancel: boolean;
  loadModel(src: ModelSource, onProgress?: (p: number) => void, options?: LoadOptions): Promise<boolean>;
  generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;
  formatChatPrompt(messages: ChatPromptMessage[], addGenerationPrompt?: boolean): Promise<string>;
  cancel(): Promise<void>;
  unloadModel(): Promise<void>;
  isLoaded(): Promise<boolean>;
  close(): Promise<void>;

  ttsLoadModel(
    src: TtsModelSource,
    options?: TtsLoadOptions,
    onProgress?: (update: TtsProgressUpdate) => void
  ): Promise<boolean>;
  ttsUnloadModel(): Promise<void>;
  ttsIsLoaded(): Promise<boolean>;
  ttsVoices(): Promise<string[]>;
  ttsSynthesize(
    prompt: string,
    options?: TtsSynthesisOptions,
    onProgress?: (update: TtsProgressUpdate) => void
  ): Promise<TtsSynthesisResult>;
}
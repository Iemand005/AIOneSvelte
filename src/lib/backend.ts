import type { GenerateStats } from "aione-web";

export type { GenerateStats };

export interface GenerateResult { content: string; stats: GenerateStats }

export interface GenerateCallbacks {
  onToken?: (token: string, thinking: boolean) => void;
  onThinkingChange?: (thinking: boolean) => void;
  onPromptProgress?: (progress: number) => void;
  onGenerationStart?: () => void;
}

export type ModelSource =
  | { kind: "path"; path: string }
  | { kind: "file"; file: File }
  | { kind: "url"; url: string };

export interface Backend {
  readonly kind: "native" | "wasm";
  loadModel(src: ModelSource, onProgress?: (p: number) => void): Promise<boolean>;
  generate(prompt: string, maxTokens?: number, cb?: GenerateCallbacks): Promise<GenerateResult>;
  cancel(): Promise<void>;
  unloadModel(): Promise<void>;
  isLoaded(): Promise<boolean>;
  close(): Promise<void>;
}
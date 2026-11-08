import { invoke } from "@tauri-apps/api/core";
import * as native from "./aione-native"; // your existing functions
import type {
  Backend,
  ChatPromptMessage,
  GenerateOptions,
  LoadOptions,
  ModelSource,
  TtsLoadOptions,
  TtsModelSource,
  TtsSynthesisOptions,
  TtsSynthesisResult
} from "./backend";

export class NativeBackend implements Backend {
  readonly kind = "native" as const;
  readonly canCancel = true;

  static async create() {
    await native.createSession();
    return new NativeBackend();
  }

  loadModel(src: ModelSource, onProgress?: (p: number) => void, options: LoadOptions = {}) {
    if (src.kind !== "path") throw new Error("Native backend needs a file path");
    return native.loadModel(src.path, onProgress, options);
  }
  generate(prompt: string, options: GenerateOptions = {}) {
    const {
      maxTokens = 512,
      minP = 0.05,
      topK = 40,
      temperature = 0.8,
      seed = 0xffffffff,
      callbacks = {}
    } = options;
    return native.generate(
      prompt,
      { maxTokens, minP, topK, temperature, seed },
      callbacks
    );
  }
  formatChatPrompt(messages: ChatPromptMessage[], addGenerationPrompt = true) {
    return native.formatChatPrompt(messages, addGenerationPrompt);
  }
  async cancel() { await invoke<void>("aione_cancel_generation"); }
  unloadModel() { return native.unloadModel(); }
  isLoaded() { return native.isLoaded(); }
  close() { return native.destroySession(); }

  ttsLoadModel(src: TtsModelSource, options: TtsLoadOptions = {}) {
    if (src.kind !== "path") throw new Error("Native backend needs a file path");
    return native.ttsLoadModel(src.modelPath, src.mmprojPath, options);
  }
  ttsUnloadModel() { return native.ttsUnloadModel(); }
  ttsIsLoaded() { return native.ttsIsLoaded(); }
  ttsVoices() { return native.ttsVoices(); }
  ttsSynthesize(prompt: string, options: TtsSynthesisOptions = {}): Promise<TtsSynthesisResult> {
    return native.ttsSynthesize(prompt, options);
  }
}
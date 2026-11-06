import { invoke } from "@tauri-apps/api/core";
import * as native from "./aione-native"; // your existing functions
import type {
  Backend,
  ChatPromptMessage,
  GenerateOptions,
  LoadOptions,
  ModelSource
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
    const { maxTokens = 512, temperature = 0.8, callbacks = {} } = options;
    return native.generate(prompt, maxTokens, temperature, callbacks);
  }
  formatChatPrompt(messages: ChatPromptMessage[], addGenerationPrompt = true) {
    return native.formatChatPrompt(messages, addGenerationPrompt);
  }
  async cancel() { await invoke<void>("aione_cancel_generation"); }
  unloadModel() { return native.unloadModel(); }
  isLoaded() { return native.isLoaded(); }
  close() { return native.destroySession(); }
}
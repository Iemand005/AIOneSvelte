import { invoke } from "@tauri-apps/api/core";
import * as native from "./aione-tauri"; // your existing functions
import type { Backend, ModelSource, GenerateCallbacks } from "./backend";

export class NativeBackend implements Backend {
  readonly kind = "native" as const;

  static async create() {
    await native.createSession();
    return new NativeBackend();
  }

  loadModel(src: ModelSource, onProgress?: (p: number) => void) {
    if (src.kind !== "path") throw new Error("Native backend needs a file path");
    return native.loadModel(src.path, onProgress);
  }
  generate(prompt: string, maxTokens = 512, cb: GenerateCallbacks = {}) {
    return native.generate(prompt, maxTokens, cb);
  }
  cancel() { return invoke<void>("aione_cancel_generation"); }
  unloadModel() { return native.unloadModel(); }
  isLoaded() { return native.isLoaded(); }
  close() { return native.destroySession(); }
}
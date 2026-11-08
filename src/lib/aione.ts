import AIOne, { type GenerateStats } from "aione-web";
import type {
	Backend,
	ChatPromptMessage,
	GenerateCallbacks,
	GenerateOptions,
	GenerateResult,
	ModelSource,
	TtsLoadOptions,
	TtsModelSource,
	TtsSynthesisOptions,
	TtsSynthesisResult,
} from "./backend";

export type {
	GenerateStats,
	Backend,
	ModelSource,
	GenerateCallbacks,
	GenerateOptions,
	GenerateResult,
};

const BASE_URL = import.meta.env.BASE_URL;

const threaded = crossOriginIsolated && typeof SharedArrayBuffer !== "undefined";
let usingThreads = false;

type AIOneInstance = Awaited<ReturnType<typeof AIOne.create>>;

type TtsCapableAIOne = AIOneInstance & {
	ttsLoadModel(
		modelFile: File,
		mmprojFile: File,
		options?: TtsLoadOptions
	): Promise<void>;
	ttsSynthesize(
		prompt: string,
		options?: TtsSynthesisOptions
	): Promise<TtsSynthesisResult>;
	ttsUnloadModel(): Promise<void>;
	ttsVoices(): Promise<string[]>;
	ttsIsLoaded(): Promise<boolean>;
};

async function threadedRuntimeAvailable() {
	if (!threaded) return false;

	const files = [
		"build/Release-mt/AIOneWebMT.js",
		"build/Release-mt/AIOneWebMT.wasm",
	];

	try {
		const checks = await Promise.all(
			files.map(file =>
				fetch(`${BASE_URL}${file}`, {
					method: "HEAD",
					cache: "no-store",
				}).then(response => response.ok)
			)
		);

		return checks.every(Boolean);
	} catch {
		return false;
	}
}

export class WasmBackend implements Backend {
	readonly kind = "wasm" as const;
	readonly canCancel = false;

	private constructor(private ai: AIOneInstance) {}

	static async create(): Promise<WasmBackend> {
		usingThreads = threaded && (await threadedRuntimeAvailable());

		const workerUrl = `${BASE_URL}worker-runtime.js${usingThreads ? "?threads=1" : ""}`;
		const ai = await AIOne.create({ workerUrl, workerType: "dedicated", threads: true });

		return new WasmBackend(ai);
	}

	async loadModel(src: ModelSource, onProgress?: (p: number) => void): Promise<boolean> {
		if (src.kind !== "file") throw new Error("WASM backend can't load from a disk path");

		await this.ai.loadModel(src.file, onProgress);
		return true;
	}

	generate(
		prompt: string,
		{ maxTokens = 512, callbacks = {} }: GenerateOptions = {}
	): Promise<GenerateResult> {
		return this.ai.generate(prompt, maxTokens, callbacks);
	}

	async formatChatPrompt(
		messages: ChatPromptMessage[],
		addGenerationPrompt = true
	): Promise<string> {
		const prompt = messages
			.map(message => `${message.role}: ${message.content}`)
			.join("\n");
		return addGenerationPrompt ? `${prompt}\nassistant:` : prompt;
	}

	async cancel(): Promise<void> {}

	async unloadModel(): Promise<void> {
		await this.ai.unloadModel();
	}

	async isLoaded(): Promise<boolean> {
		return true;
	}

	async ttsLoadModel(src: TtsModelSource, options: TtsLoadOptions = {}): Promise<boolean> {
		if (src.kind !== "file") throw new Error("WASM backend can't load from a disk path");

		const api = this.ai as unknown as TtsCapableAIOne;
		await api.ttsLoadModel(src.modelFile, src.mmprojFile, options);
		return api.ttsIsLoaded();
	}

	async ttsUnloadModel(): Promise<void> {
		await (this.ai as unknown as TtsCapableAIOne).ttsUnloadModel();
	}

	ttsIsLoaded(): Promise<boolean> {
		return (this.ai as unknown as TtsCapableAIOne).ttsIsLoaded();
	}

	ttsVoices(): Promise<string[]> {
		return (this.ai as unknown as TtsCapableAIOne).ttsVoices();
	}

	ttsSynthesize(
		prompt: string,
		options: TtsSynthesisOptions = {}
	): Promise<TtsSynthesisResult> {
		return (this.ai as unknown as TtsCapableAIOne).ttsSynthesize(prompt, options);
	}

	async close(): Promise<void> {
		this.ai.close();
		usingThreads = false;
	}
}

const isTauri = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

let backend: Backend | null = null;

export async function initializeAIOne(): Promise<Backend> {
	if (backend) return backend;

	if (isTauri()) {
		const { NativeBackend } = await import("./aione-tauri");
		backend = await NativeBackend.create();
	} else {
		backend = await WasmBackend.create();
	}

	return backend;
}

export async function closeAIOne(): Promise<void> {
	await backend?.close();
	backend = null;
}
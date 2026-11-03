import AIOne, { type GenerateStats } from "aione-web";
import type {
	Backend,
	GenerateCallbacks,
	GenerateResult,
	ModelSource,
} from "./backend";

export type { GenerateStats, Backend, ModelSource, GenerateCallbacks, GenerateResult };

const BASE_URL = import.meta.env.BASE_URL;

export const threaded = crossOriginIsolated && typeof SharedArrayBuffer !== "undefined";
export let usingThreads = false;

type AIOneInstance = Awaited<ReturnType<typeof AIOne.create>>;

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

	private constructor(private ai: AIOneInstance) {}

	static async create(): Promise<WasmBackend> {
		usingThreads = threaded && (await threadedRuntimeAvailable());

		const workerUrl = `${BASE_URL}worker-runtime.js${usingThreads ? "?threads=1" : ""}`;
		const ai = await AIOne.create({ workerUrl, workerType: "dedicated", threads: true });

		return new WasmBackend(ai);
	}

	async loadModel(src: ModelSource, onProgress?: (p: number) => void): Promise<boolean> {
		let data: ArrayBuffer;
		if (src.kind === "file") data = await src.file.arrayBuffer();
		else if (src.kind === "url") data = await (await fetch(src.url)).arrayBuffer();
		else throw new Error("WASM backend can't load from a disk path");

		return this.ai.loadModel(data, onProgress); // ADAPT
	}

	generate(
		prompt: string,
		maxTokens = 512,
		cb: GenerateCallbacks = {}
	): Promise<GenerateResult> {
		return this.ai.generate(prompt, { maxTokens, ...cb }); // ADAPT
	}

	async cancel(): Promise<void> {
		this.ai.cancel(); // ADAPT
	}

	async unloadModel(): Promise<void> {
		this.ai.unloadModel(); // ADAPT
	}

	async isLoaded(): Promise<boolean> {
		return this.ai.isLoaded(); // ADAPT
	}

	async close(): Promise<void> {
		this.ai.close();
		usingThreads = false;
	}
}

// ---- backend selection ----

const isTauri = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

let backend: Backend | null = null;

export async function initializeAIOne(): Promise<Backend> {
	if (backend) return backend;

	if (isTauri()) {
		const { NativeBackend } = await import("./aione-native");
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
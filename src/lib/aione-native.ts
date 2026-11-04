import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export interface GenerateStats {
	promptTokens: number;
	evaluatedTokens: number;
	cachedTokens: number;
	generatedTokens: number;
	promptEvalMs: number;
	generationMs: number;
	promptTokensPerSecond: number;
	tokensPerSecond: number;
}

export interface GenerateResult {
	content: string;
	stats: GenerateStats;
}

export interface GenerateCallbacks {
	onToken?: (token: string, thinking: boolean) => void;
	onThinkingChange?: (thinking: boolean) => void;
	onPromptProgress?: (progress: number) => void;
	onGenerationStart?: () => void;
}

interface TokenEvent {
	token: string;
	thinking: boolean;
}

export interface HardwareDevice {
	index: number;
	name: string;
	description: string;
	type: string;
	memoryFree: number;
	memoryTotal: number;
	deviceId: string;
}

export interface SystemInfo {
	devices: HardwareDevice[];
	systemInfo: string;
}

export function isNativeAIOneAvailable(): boolean {
	return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function createSession(): Promise<void> {
	await invoke("aione_create_session");
}

export async function loadModel(
	path: string,
	onProgress?: (progress: number) => void
): Promise<boolean> {
	let unlisten: UnlistenFn | undefined;

	if (onProgress) {
		unlisten = await listen<number>("aione-model-progress", event => {
			onProgress(event.payload);
		});
	}

	try {
		return await invoke<boolean>("aione_load_model", { path });
	} finally {
		unlisten?.();
	}
}

export async function generate(
	prompt: string,
	maxTokens = 512,
	callbacks: GenerateCallbacks = {}
): Promise<GenerateResult> {
	const unlisteners: UnlistenFn[] = [];

	if (callbacks.onToken) {
		unlisteners.push(
			await listen<TokenEvent>("aione-token", event => {
				callbacks.onToken?.(event.payload.token, event.payload.thinking);
			})
		);
	}

	if (callbacks.onThinkingChange) {
		unlisteners.push(
			await listen<boolean>("aione-think-state", event => {
				callbacks.onThinkingChange?.(event.payload);
			})
		);
	}

	if (callbacks.onPromptProgress) {
		unlisteners.push(
			await listen<number>("aione-input-eval", event => {
				callbacks.onPromptProgress?.(event.payload);
			})
		);
	}

	if (callbacks.onGenerationStart) {
		unlisteners.push(
			await listen<null>("aione-generation-start", () => {
				callbacks.onGenerationStart?.();
			})
		);
	}

	try {
		return await invoke<GenerateResult>("aione_generate", {
			prompt,
			maxTokens
		});
	} finally {
		for (const unlisten of unlisteners) unlisten();
	}
}

export async function unloadModel(): Promise<void> {
	await invoke("aione_unload_model");
}

export async function isLoaded(): Promise<boolean> {
	return invoke<boolean>("aione_is_loaded");
}

export async function destroySession(): Promise<void> {
	await invoke("aione_destroy_session");
}

export async function getSystemInfo(): Promise<SystemInfo> {
	return invoke<SystemInfo>("aione_system_info");
}

export interface ChatMetadata {
	folder: string;
	title: string;
	model: string;
	systemPrompt: string;
	created: number;
	updated: number;
}

export interface ChatMessage {
	id: number;
	parentId: number;
	role: string;
	content: string;
	creationTime: number;
	finishTime: number;
}

export interface ChatData extends ChatMetadata {
	messages: ChatMessage[];
}

export async function listChats(): Promise<ChatMetadata[]> {
	return invoke<ChatMetadata[]>("aione_chat_list");
}

export async function createChat(
	title: string,
	model: string,
	systemPrompt: string
): Promise<ChatMetadata> {
	return invoke<ChatMetadata>("aione_chat_create", { title, model, systemPrompt });
}

export async function loadChat(folder: string): Promise<ChatData> {
	return invoke<ChatData>("aione_chat_load", { folder });
}

export async function appendChatMessage(
	folder: string,
	role: string,
	content: string
): Promise<ChatMessage> {
	return invoke<ChatMessage>("aione_chat_append", { folder, role, content });
}

export async function updateChatMetadata(
	folder: string,
	title: string | null,
	model: string | null,
	systemPrompt: string | null
): Promise<void> {
	await invoke("aione_chat_update", { folder, title, model, systemPrompt });
}

export async function deleteChat(folder: string): Promise<void> {
	await invoke("aione_chat_delete", { folder });
}

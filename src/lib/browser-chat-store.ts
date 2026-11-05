import type { ChatData, ChatMessage, ChatMetadata } from "./aione-native";

const STORAGE_KEY = "aione.chats";

function readChats(): ChatData[] {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) return [];

	const chats: unknown = JSON.parse(stored);
	if (!Array.isArray(chats)) {
		throw new Error("Saved browser chats have an invalid format");
	}

	return chats as ChatData[];
}

function writeChats(chats: ChatData[]) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

function createId(): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}

	return `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export async function listChats(): Promise<ChatMetadata[]> {
	return readChats().map(
		({ messages: _messages, activePath: _activePath, ...metadata }) => metadata
	);
}

export async function createChat(
	title: string,
	model: string,
	systemPrompt: string
): Promise<ChatMetadata> {
	const now = Date.now();
	const chat: ChatData = {
		folder: createId(),
		title,
		model,
		systemPrompt,
		created: now,
		updated: now,
		messages: [],
		activePath: []
	};

	writeChats([...readChats(), chat]);
	return {
		folder: chat.folder,
		title: chat.title,
		model: chat.model,
		systemPrompt: chat.systemPrompt,
		created: chat.created,
		updated: chat.updated
	};
}

export async function loadChat(folder: string): Promise<ChatData> {
	const chat = readChats().find(item => item.folder === folder);
	if (!chat) throw new Error(`Saved browser chat not found: ${folder}`);
	return chat;
}

export async function appendChatMessage(
	folder: string,
	role: string,
	content: string,
	parentId = "0"
): Promise<ChatMessage> {
	const chats = readChats();
	const chat = chats.find(item => item.folder === folder);
	if (!chat) throw new Error(`Saved browser chat not found: ${folder}`);

	const now = Date.now();
	const message: ChatMessage = {
		id: createId(),
		parentId,
		role,
		content,
		creationTime: now,
		finishTime: now
	};
	const parentPath: string[] = [];
	let ancestorId = parentId;

	while (ancestorId !== "0") {
		const ancestor = chat.messages.find(item => item.id === ancestorId);
		if (!ancestor || parentPath.includes(ancestor.id)) {
			throw new Error(`Invalid parent message in saved browser chat: ${ancestorId}`);
		}
		parentPath.push(ancestor.id);
		ancestorId = ancestor.parentId;
	}

	chat.messages.push(message);
	chat.activePath = [...parentPath.reverse(), message.id];
	chat.updated = now;
	writeChats(chats);
	return message;
}

export async function updateChatMetadata(
	folder: string,
	title: string | null,
	model: string | null,
	systemPrompt: string | null
): Promise<void> {
	const chats = readChats();
	const chat = chats.find(item => item.folder === folder);
	if (!chat) throw new Error(`Saved browser chat not found: ${folder}`);

	if (title !== null) chat.title = title;
	if (model !== null) chat.model = model;
	if (systemPrompt !== null) chat.systemPrompt = systemPrompt;
	chat.updated = Date.now();
	writeChats(chats);
}

export async function deleteChat(folder: string): Promise<void> {
	const chats = readChats();
	if (!chats.some(chat => chat.folder === folder)) {
		throw new Error(`Saved browser chat not found: ${folder}`);
	}
	writeChats(chats.filter(chat => chat.folder !== folder));
}

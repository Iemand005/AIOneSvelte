import type { GenerateStats } from "aione-web";

export type ChatRole = "user" | "assistant";

export interface ChatNode {
	id: string;
	parentId: string | null;
	nativeId?: number;
	role: ChatRole;
	content: string;
	thinking?: string;
	stats?: GenerateStats;
}

export type VersionSelections = Record<string, string>;

export const ROOT_PARENT = "__root__";

export function parentKey(parentId: string | null): string {
	return parentId ?? ROOT_PARENT;
}

export function getSiblings(messages: ChatNode[], parentId: string | null): ChatNode[] {
	return messages.filter(message => message.parentId === parentId);
}

export function buildActivePath(
	messages: ChatNode[],
	selections: VersionSelections
): ChatNode[] {
	const path: ChatNode[] = [];
	const visited = new Set<string>();
	let parentId: string | null = null;

	while (true) {
		const siblings = getSiblings(messages, parentId);
		if (siblings.length === 0) break;

		const selectedId = selections[parentKey(parentId)];
		const selected = selectedId
			? siblings.find(message => message.id === selectedId)
			: undefined;
		const next = selected ?? siblings[siblings.length - 1];

		if (visited.has(next.id)) break;

		visited.add(next.id);
		path.push(next);
		parentId = next.id;
	}

	if (path.length === 0 && messages.length > 0) {
		return messages;
	}

	return path;
}

let fallbackId = 0;

export function createMessageId(): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}

	fallbackId += 1;
	return `msg-${Date.now().toString(36)}-${fallbackId.toString(36)}`;
}

interface PersistedMessage {
	id: number;
	parentId: number;
	role: string;
	content: string;
	creationTime?: number;
}

export function nodesFromPersisted(source: PersistedMessage[]): ChatNode[] {
	const systemIds = new Set<string>();
	const ids = new Map<string, string>();

	for (const message of source) {
		const nativeKey = String(message.id);

		if (message.role === "system") {
			systemIds.add(nativeKey);
		} else {
			ids.set(nativeKey, createMessageId());
		}
	}

	const nodes: ChatNode[] = [];

	for (const message of source) {
		if (message.role === "system") continue;

		const id = ids.get(String(message.id));
		if (!id) continue;

		const parentNative = String(message.parentId);
		let parentId: string | null = null;

		if (message.parentId !== 0 && !systemIds.has(parentNative)) {
			parentId = ids.get(parentNative) ?? null;
		}

		nodes.push({
			id,
			parentId,
			nativeId: message.id,
			role: message.role === "assistant" ? "assistant" : "user",
			content: message.content
		});
	}

	return nodes;
}

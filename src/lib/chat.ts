import type { GenerateStats } from "aione-web";

export type ChatRole = "user" | "assistant";

export interface ChatNode {
	id: string;
	parentId: string | null;
	nativeId?: string;
	role: ChatRole;
	content: string;
	creationTime?: number;
	thinking?: string;
	stats?: GenerateStats;
}

export type VersionSelections = Record<string, string>;

export const ROOT_PARENT = "__root__";

export function parentKey(parentId: string | null): string {
	return parentId ?? ROOT_PARENT;
}

export function getSiblings(messages: ChatNode[], parentId: string | null): ChatNode[] {
	return messages
		.map((message, index) => ({ message, index }))
		.filter(({ message }) => message.parentId === parentId)
		.sort((left, right) =>
			(left.message.creationTime ?? 0) - (right.message.creationTime ?? 0) ||
			left.index - right.index
		)
		.map(({ message }) => message);
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

		const selectedId: string | undefined = selections[parentKey(parentId)];
		const selected: ChatNode | undefined = selectedId
			? siblings.find(message => message.id === selectedId)
			: undefined;
		const next: ChatNode = selected ?? siblings[0];

		if (visited.has(next.id)) break;

		visited.add(next.id);
		path.push(next);
		parentId = next.id;
	}

	if (path.length < 2 && messages.length > 1) {
		return messages
			.sort((left, right) =>
				(left.creationTime ?? 0) - (right.creationTime ?? 0)
			);
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

export interface PersistedMessage {
	id: string;
	parentId: string;
	role: string;
	content: string;
	creationTime?: number;
}

export function nodesFromPersisted(source: PersistedMessage[]): ChatNode[] {
	const valid = source.filter(message => message.role !== "system");
	const ids = new Map(
		valid.map(message => [String(message.id), createMessageId()])
	);

	return valid.map(message => {
		const id = ids.get(String(message.id));
		if (id === undefined) {
			throw new Error(`Missing frontend ID for persisted message ${message.id}`);
		}
		const parentNative = String(message.parentId);
		return {
			id,
			parentId: ids.get(parentNative) ?? null,
			nativeId: message.id,
			role: message.role === "assistant" ? "assistant" : "user",
			content: message.content,
			creationTime: message.creationTime
		} satisfies ChatNode;
	});
}

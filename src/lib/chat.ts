import type { GenerateStats } from "aione-web";

export type ChatRole = "user" | "assistant";

export interface ChatNode {
	id: string;
	parentId: string | null;
	nativeId?: number;
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
		let next: ChatNode = selected ?? siblings[0];

		if (!selected && !messages.some(message => message.parentId === next.id)) {
			next =
				siblings.find(sibling => messages.some(message => message.parentId === sibling.id)) ??
				next;
		}

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

interface PersistedMessage {
	id: number;
	parentId: number;
	role: string;
	content: string;
	creationTime?: number;
}

export function nodesFromPersisted(source: PersistedMessage[]): ChatNode[] {
	const systemIds = new Set<string>();
	const latestById = new Map<string, PersistedMessage>();
	const idOrder: string[] = [];

	for (const message of source) {
		if (!["system", "user", "assistant"].includes(message.role)) continue;

		const nativeKey = String(message.id);
		if (!latestById.has(nativeKey)) idOrder.push(nativeKey);
		latestById.set(nativeKey, message);
	}

	const valid = idOrder.map(nativeKey => latestById.get(nativeKey)!);
	for (const message of valid) {
		if (message.role === "system") systemIds.add(String(message.id));
	}
	const ids = new Map(
		valid
			.filter(message => message.role !== "system")
			.map(message => [String(message.id), createMessageId()])
	);

	const nodes: ChatNode[] = [];
	let lastId = "0";
	const validIds = new Set(valid.map(message => String(message.id)));

	for (const message of valid) {
		if (message.role === "system") {
			lastId = String(message.id);
			continue;
		}

		const id = ids.get(String(message.id));
		if (!id) continue;

		const parentNative = String(message.parentId);
		let parentId: string | null = null;

		if (message.parentId !== 0 && !systemIds.has(parentNative)) {
			parentId = ids.get(validIds.has(parentNative) ? parentNative : lastId) ?? null;
		}

		nodes.push({
			id,
			parentId,
			nativeId: message.id,
			role: message.role === "assistant" ? "assistant" : "user",
			content: message.content,
			creationTime: message.creationTime
		});
		lastId = String(message.id);
	}

	return nodes;
}

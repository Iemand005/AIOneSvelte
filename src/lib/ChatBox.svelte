<script lang="ts">
	import ChatBubble from "./ChatBubble.svelte";
	import MessageInput from "./MessageInput.svelte";
	import type { ChatMetadata } from "./aione-native";
	import type { Backend } from "./backend";
	import {
		buildActivePath,
		createMessageId,
		getSiblings,
		parentKey,
		type ChatNode,
		type VersionSelections
	} from "./chat";

	type Props = {
		ai: Backend | null;
		modelLoading?: boolean;
		systemPrompt?: string;
		messages?: ChatNode[];
		versionSelections?: VersionSelections;
		chatFolder?: string | null;
		onchatcreated?: (chat: ChatMetadata) => void;
		onpersisted?: () => void;
		onerror?: (error: unknown) => void;
	};

	let {
		ai = $bindable(null),
		modelLoading = false,
		systemPrompt = $bindable(""),
		messages = $bindable<ChatNode[]>([]),
		versionSelections = $bindable<VersionSelections>({}),
		chatFolder = $bindable<string | null>(null),
		onchatcreated,
		onpersisted,
		onerror
	}: Props = $props();

	let prompt = $state("");
	let loading = $state(false);
	let streaming = $state(false);
	let promptProgress = $state(0);
	let thinking = $state(false);
	let generating = $state<"full" | "token" | null>(null);
	let regeneratingId = $state<string | null>(null);
	let messagesElement: HTMLDivElement;
	let followBottom = $state(true);

	function updateScrollPosition(event: Event) {
		const element = event.currentTarget as HTMLDivElement;
		followBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 48;
	}

	function scrollToBottom() {
		followBottom = true;
		messagesElement.scrollTo({ top: messagesElement.scrollHeight, behavior: "smooth" });
	}

	$effect(() => {
		const lastMessage = activePath[activePath.length - 1];
		lastMessage?.content;
		lastMessage?.thinking;
		loading;
		promptProgress;

		if (followBottom && messagesElement) {
			messagesElement.scrollTop = messagesElement.scrollHeight;
		}
	});

	let activePath = $derived(buildActivePath(messages, versionSelections));
	let rendered = $derived(
		activePath.map(message => {
			const siblings = getSiblings(messages, message.parentId);
			const versionIndex = siblings.findIndex(item => item.id === message.id);

			return {
				message,
				versionIndex: versionIndex < 0 ? 0 : versionIndex,
				versionCount: siblings.length
			};
		})
	);

	function selectNode(node: ChatNode) {
		versionSelections[parentKey(node.parentId)] = node.id;
	}

	function switchVersion(message: ChatNode, direction: -1 | 1) {
		if (loading || modelLoading || generating) return;

		const siblings = getSiblings(messages, message.parentId);
		if (siblings.length < 2) return;

		const current = siblings.findIndex(item => item.id === message.id);
		if (current < 0) return;

		const next = (current + direction + siblings.length) % siblings.length;
		versionSelections[parentKey(message.parentId)] = siblings[next].id;
	}

	async function sendMessage() {
		if (!ai || !prompt.trim() || loading || modelLoading) return;

		const content = prompt.trim();
		prompt = "";

		const ancestors = [...activePath];
		const parent = ancestors.length ? ancestors[ancestors.length - 1] : null;
		const parentNativeId = parent?.nativeId ?? 0;

		messages.push({
			id: createMessageId(),
			parentId: parent?.id ?? null,
			role: "user",
			content
		});

		const user = messages[messages.length - 1];
		selectNode(user);

		let store: typeof import("./aione-native") | null = null;
		if (ai.kind === "native") {
			try {
				store = await import("./aione-native");

				if (!chatFolder) {
					const chat = await store.createChat(
						content.slice(0, 60),
						"",
						systemPrompt.trim()
					);
					chatFolder = chat.folder;
					onchatcreated?.(chat);
				} else {
					await store.updateChatMetadata(chatFolder, null, null, systemPrompt.trim());
				}

				if (chatFolder) {
					const saved = await store.appendChatMessage(
						chatFolder,
						"user",
						content,
						parentNativeId
					);
					user.nativeId = saved.id;
				}
			} catch (error) {
				onerror?.(error);
			}
		}

		messages.push({
			id: createMessageId(),
			parentId: user.id,
			role: "assistant",
			content: ""
		});

		const assistant = messages[messages.length - 1];
		selectNode(assistant);

		const promptMessages = [
			...(systemPrompt.trim()
				? [{ role: "system" as const, content: systemPrompt.trim() }]
				: []),
			...ancestors.map(message => ({
				role: message.role,
				content: message.content
			})),
			{ role: "user" as const, content: user.content }
		];

		loading = true;
		promptProgress = 0;
		thinking = false;

		try {
			const promptText = await ai.formatChatPrompt(promptMessages, true);
			const result = await ai.generate(
				promptText,
				512,
				{
					onPromptProgress: value => {
						promptProgress = value;
					},
					onGenerationStart: () => {
						promptProgress = 1;
					},
					onThinkingChange: value => {
						thinking = value;
					},
					onToken: (token, isThinking) => {
						streaming = true;

						if (isThinking) {
							assistant.thinking = (assistant.thinking ?? "") + token;
						} else {
							assistant.content += token;
						}
					}
				}
			);

			assistant.stats = result.stats;

			if (!assistant.content) {
				assistant.content = result.content;
			}

			if (store && chatFolder && assistant.content) {
				try {
					const saved = await store.appendChatMessage(
						chatFolder,
						"assistant",
						assistant.content,
						user.nativeId ?? 0
					);
					assistant.nativeId = saved.id;
					onpersisted?.();
				} catch (error) {
					onerror?.(error);
				}
			}
		} catch (error) {
			assistant.content = `Error: ${String(error)}`;
			onerror?.(error);
		} finally {
			loading = false;
			streaming = false;
			promptProgress = 0;
			thinking = false;
		}
	}

	async function regenerateMessage(target: ChatNode) {
		if (!ai || loading || modelLoading || generating || target.role !== "assistant") return;

		const targetIndex = activePath.findIndex(message => message.id === target.id);
		if (targetIndex < 0) return;

		const ancestors = activePath.slice(0, targetIndex);
		const parentNode = messages.find(message => message.id === target.parentId) ?? null;
		const parentNativeId = parentNode?.nativeId ?? 0;

		let store: typeof import("./aione-native") | null = null;
		if (ai.kind === "native") {
			try {
				store = await import("./aione-native");

				if (chatFolder) {
					await store.updateChatMetadata(chatFolder, null, null, systemPrompt.trim());
				}
			} catch (error) {
				onerror?.(error);
			}
		}

		messages.push({
			id: createMessageId(),
			parentId: target.parentId,
			role: "assistant",
			content: ""
		});

		const assistant = messages[messages.length - 1];
		selectNode(assistant);
		regeneratingId = assistant.id;

		const promptMessages = [
			...(systemPrompt.trim()
				? [{ role: "system" as const, content: systemPrompt.trim() }]
				: []),
			...ancestors.map(message => ({
				role: message.role,
				content: message.content
			}))
		];

		loading = true;
		streaming = true;
		promptProgress = 0;
		thinking = false;

		try {
			const promptText = await ai.formatChatPrompt(promptMessages, true);
			const result = await ai.generate(
				promptText,
				512,
				{
					onThinkingChange: value => {
						thinking = value;
					},
					onToken: (token, isThinking) => {
						if (isThinking) {
							assistant.thinking = (assistant.thinking ?? "") + token;
						} else {
							assistant.content += token;
						}
					}
				}
			);

			assistant.stats = result.stats;

			if (!assistant.content) {
				assistant.content = result.content;
			}

			if (store && chatFolder && assistant.content) {
				try {
					const saved = await store.appendChatMessage(
						chatFolder,
						"assistant",
						assistant.content,
						parentNativeId
					);
					assistant.nativeId = saved.id;
					onpersisted?.();
				} catch (error) {
					onerror?.(error);
				}
			}
		} catch (error) {
			assistant.content = `Error: ${String(error)}`;
			onerror?.(error);
		} finally {
			loading = false;
			streaming = false;
			regeneratingId = null;
			promptProgress = 0;
			thinking = false;
		}
	}

	function cleanGenerated(text: string) {
		let value = text.trim();
		value = value.replace(/^(user|assistant)\s*:\s*/i, "");

		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1).trim();
		}

		return value;
	}

	async function generateUserInput(maxTokens = 512) {
		if (!ai || loading || modelLoading || generating) return;

		const draft = prompt;
		const hasDraft = draft.trim().length > 0;
		const singleToken = maxTokens === 1;

		const context = activePath
			.filter(message => message.content.trim())
			.map(message => `${message.role}: ${message.content}`)
			.join("\n");

		const instruction = hasDraft
			? "The user is drafting a message. Continue it naturally in the user's voice. Output only the continuation text, without repeating what is already written and without quotes or commentary."
			: "Write the next message the user would send in the conversation below. Output only the message text, without quotes or commentary.";

		const generationPrompt = [
			`system: ${instruction}`,
			context,
			hasDraft ? `user: ${draft}` : "user:"
		]
			.filter(Boolean)
			.join("\n");

		let streamed = "";
		generating = singleToken ? "token" : "full";

		try {
			const result = await ai.generate(generationPrompt, maxTokens, {
				onToken: (token, isThinking) => {
					if (isThinking) return;
					streamed += token;
					prompt = hasDraft ? `${draft}${streamed}` : streamed;
				}
			});

			const raw = result.content || streamed;

			if (singleToken) {
				const token = raw.replace(/^[\r\n]+/, "");

				if (token) {
					prompt = hasDraft ? `${draft}${token}` : token;
				}

				return;
			}

			const text = cleanGenerated(raw.trim() || streamed);

			if (text) {
				prompt = hasDraft ? `${draft.trimEnd()} ${text}` : text;
			}
		} catch (error) {
			onerror?.(error);
		} finally {
			generating = null;
		}
	}
</script>

<section class="chat">
	<div
		class="messages"
		bind:this={messagesElement}
		onscroll={updateScrollPosition}
		role="log"
		aria-live="polite"
	>
		{#each rendered as item (item.message.id)}
			{#if item.message.role !== "assistant" || item.message.content || item.message.thinking || item.message.stats || regeneratingId === item.message.id}
				<ChatBubble
					message={item.message}
					id={`message-${item.message.id}`}
					versionIndex={item.versionIndex}
					versionCount={item.versionCount}
					regenerating={regeneratingId === item.message.id}
					disabled={loading || modelLoading || Boolean(generating)}
					onregenerate={regenerateMessage}
					onversion={switchVersion}
				/>
			{/if}
		{/each}

		{#if loading && !streaming}
			<article class="status">
				<strong>AIOne</strong>
				<p>
					{#if promptProgress < 1}
						Preprocessing prompt… {Math.round(promptProgress * 100)}%
					{:else}
						{thinking ? "Thinking…" : "Waiting for response…"}
					{/if}
				</p>

				{#if promptProgress < 1}
					<div
						class="progress"
						role="progressbar"
						aria-valuemin="0"
						aria-valuemax="100"
						aria-valuenow={Math.round(promptProgress * 100)}
					>
						<div
							class="progress-fill"
							style:width={`${Math.round(promptProgress * 100)}%`}
						></div>
					</div>
				{/if}
			</article>
		{/if}
	</div>

	{#if !followBottom && activePath.length > 0}
		<button
			type="button"
			class="scroll-bottom"
			aria-label="Scroll to latest message"
			title="Scroll to latest message"
			onclick={scrollToBottom}
		>
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path
					d="M12 5v14m-7-7 7 7 7-7"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>
	{/if}
	
	<MessageInput
		bind:prompt
		loading={loading || modelLoading}
		{generating}
		{sendMessage}
		generateMessage={generateUserInput}
		generateToken={() => generateUserInput(1)}
	/>
</section>

<style>
	.chat {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;

		position: relative;
	}

	.messages {
		position: relative;

		display: flex;
		flex-direction: column;
		gap: 1rem;
		flex: 1;
		min-height: 0;

		overflow-y: auto;
		scrollbar-gutter: stable both-edges;

		padding: var(--chatbox-pad);

		padding-bottom: calc(var(--message-box-size) + var(--chatbox-pad) * 2 + 1rem);
	}

	.scroll-bottom {
		position: absolute;
		z-index: 2;
		left: 50%;
		bottom: calc(var(--message-box-size) + var(--chatbox-pad) * 2 + 0.75rem);
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		padding: 0;
		transform: translateX(-50%);
		border: 1px solid #ffffff26;
		border-radius: 50%;
		background: var(--chat-bubble-bg);
		color: inherit;
		box-shadow: 0 2px 10px #00000030;
		cursor: pointer;
	}

	.scroll-bottom:hover {
		background: #77777740;
	}

	.scroll-bottom svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	.status {
		align-self: flex-start;
		max-width: 80%;
		padding: 0.75rem 1rem;
		border-radius: calc(var(--message-box-size) / 2);
		border-bottom-left-radius: 0.25rem;
		background: var(--chat-bubble-bg);
		color: white;
	}

	.status p {
		margin: 0.4rem 0 0;
	}

	.progress {
		margin-top: 0.5rem;
		height: 4px;
		overflow: hidden;
		border-radius: 999px;
		background: #00000080;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, rgb(119 26 20), rgb(224 83 63));
		transition: width 120ms ease-out;
	}
</style>
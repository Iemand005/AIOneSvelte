<script lang="ts">
	import type AIOne from "aione-web";
	import type { Message } from "aione-web";
	import ChatBubble from "./ChatBubble.svelte";
	import MessageInput from "./MessageInput.svelte";
	import type { ChatMetadata } from "./aione-native";
    import type { Backend } from "./backend";

	type Props = {
		ai: Backend | null;
		loading?: boolean;
		systemPrompt?: string;
		messages?: Message[];
		chatFolder?: string | null;
		onchatcreated?: (chat: ChatMetadata) => void;
		onpersisted?: () => void;
		onerror?: (error: unknown) => void;
	};

	let {
		ai = $bindable(null),
		loading = $bindable(false),
		systemPrompt = $bindable(""),
		messages = $bindable<Message[]>([]),
		chatFolder = $bindable<string | null>(null),
		onchatcreated,
		onpersisted,
		onerror
	}: Props = $props();

	let prompt = $state("");
	let streaming = $state(false);
	let promptProgress = $state(0);
	let thinking = $state(false);
	let generating = $state<"full" | "token" | null>(null);

	async function sendMessage() {
		if (!ai || !prompt.trim() || loading) return;

		const content = prompt.trim();
		prompt = "";

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
					await store.appendChatMessage(chatFolder, "user", content);
				}
			} catch (error) {
				onerror?.(error);
			}
		}

		messages.push({ role: "user", content });

		const index = messages.length;
		const conversation = [
			...(systemPrompt.trim()
				? [{ role: "system" as const, content: systemPrompt.trim() }]
				: []),
			...messages
		]
			.map(m => `${m.role}: ${m.content}`)
			.join("\n");

		messages.push({ role: "assistant", content: "" });
		loading = true;
		promptProgress = 0;
		thinking = false;

		try {
			const result = await ai.generate(
				`${conversation}\nassistant:`,
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
							messages[index].thinking = (messages[index].thinking ?? "") + token;
						} else {
							messages[index].content += token;
						}
					}
				}
			);

			messages[index].stats = result.stats;

			if (!messages[index].content && !messages[index].thinking) {
				messages[index].content = result.content;
			}

			if (store && chatFolder && messages[index].content) {
				try {
					await store.appendChatMessage(chatFolder, "assistant", messages[index].content);
					onpersisted?.();
				} catch (error) {
					onerror?.(error);
				}
			}
		} catch (error) {
			messages[index].content = `Error: ${String(error)}`;
			onerror?.(error);
		} finally {
			loading = false;
			streaming = false;
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
		if (!ai || loading || generating) return;

		const draft = prompt;
		const hasDraft = draft.trim().length > 0;
		const singleToken = maxTokens === 1;

		const context = messages
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
	<div class="messages" role="log" aria-live="polite">
		{#each messages as message, index}
			{#if message.role !== "assistant" || message.content || message.thinking || message.stats}
				<ChatBubble {message} id={`message-${index}`} />
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
	
	<MessageInput
		bind:prompt
		{loading}
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

		padding-bottom: calc(var(--message-box-size) + 1rem);
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
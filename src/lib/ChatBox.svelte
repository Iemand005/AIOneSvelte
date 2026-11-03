<script lang="ts">
	import type AIOne from "aione-web";
	import type { Message } from "aione-web";
	import ChatBubble from "./ChatBubble.svelte";
	import MessageInput from "./MessageInput.svelte";

	type Props = {
		ai: AIOne | null;
		loading?: boolean;
		systemPrompt?: string;
		onerror?: (error: unknown) => void;
	};

	let {
		ai = $bindable(null),
		loading = $bindable(false),
		systemPrompt = $bindable(""),
		onerror
	}: Props = $props();

	let prompt = $state("");
	let streaming = $state(false);
	let promptProgress = $state(0);
	let thinking = $state(false);
	let messages: Message[] = $state([]);

	async function sendMessage() {
		if (!ai || !prompt.trim() || loading) return;

		messages.push({ role: "user", content: prompt.trim() });
		prompt = "";

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
</script>

<section class="chat">
	<div class="messages" role="log" aria-live="polite">
		{#each messages as message}
			{#if message.role !== "assistant" || message.content || message.thinking || message.stats}
				<ChatBubble {message} />
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

	<MessageInput bind:prompt {loading} {sendMessage} />
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
		display: flex;
		flex-direction: column;
		gap: 1rem;
		flex: 1;
		min-height: 0;
		overflow-y: auto;

		padding: var(--chatbox-pad);

		padding-bottom: calc(var(--message-box-size) + 1rem);
	}

	.status {
		align-self: flex-start;
		max-width: 80%;
		padding: 0.75rem 1rem;
		border-radius: calc(var(--message-box-size) / 2);
		border-bottom-left-radius: 0.25rem;
		background: #292929;
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
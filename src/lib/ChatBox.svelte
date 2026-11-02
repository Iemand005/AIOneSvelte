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

		try {
			const response = await ai.generate(
				`${conversation}\nassistant:`,
				512,
				token => {
					streaming = true;
					messages[index].content += token;
				}
			);

			messages[index].content = response;
		} catch (error) {
			messages[index].content = `Error: ${String(error)}`;
			onerror?.(error);
		} finally {
			loading = false;
			streaming = false;
		}
	}
</script>

<section class="chat">
	<div class="messages" role="log" aria-live="polite">
		{#each messages as message, i}
			<ChatBubble {message} />
		{/each}

		{#if loading && !streaming}
			<article class="assistant">
				<strong>AIOne</strong>
				<p>Thinking...</p>
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

	.assistant {
		align-self: flex-start;
	}
</style>
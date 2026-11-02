<script lang="ts">
    import ChatBubble from "./ChatBubble.svelte";


	type Props = {
		ai: AIOne | null;
		loading?: boolean;
		onerror?: (error: unknown) => void;
	};

	let {
		ai = $bindable(null),
		loading = $bindable(false),
		onerror
	}: Props = $props();
	
	async function sendMessage() {
		if (!ai || !prompt.trim() || loading) return;

		const content = prompt.trim();
		prompt = "";

		messages = [...messages, { role: "user", content }];

		const conversation = messages
		.map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
		.join("\n");

		const assistantIndex = messages.length;

		loading = true;
		streaming = false;

		try {
		const response = await ai.generate(
			`${conversation}\nAssistant:`,
			512,
			token => {
			console.log("STREAM:", JSON.stringify(token));
			if (!streaming) {
				streaming = true;
				messages = [...messages, { role: "assistant", content: token }];
				return;
			}

			messages = messages.map((message, index) =>
				index === assistantIndex
				? { ...message, content: message.content + token }
				: message
			);
			}
		);

		if (!streaming) {
			messages = [...messages, { role: "assistant", content: response }];
		} else {
			messages = messages.map((message, index) =>
			index === assistantIndex
				? { ...message, content: response }
				: message
			);
		}
		} catch (error) {
		if (!streaming) {
			messages = [...messages, {
			role: "assistant",
			content: `Error: ${String(error)}`
			}];
		} else {
			messages = messages.map((message, index) =>
			index === assistantIndex
				? { ...message, content: `Error: ${String(error)}` }
				: message
			);
		}
		} finally {
		loading = false;
		streaming = false;
		}
	}
</script>


<section class="chat">
    <div class="messages">
      {#each messages as message}
        <ChatBubble {message}/>
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
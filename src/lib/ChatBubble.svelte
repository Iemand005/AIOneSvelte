<script lang="ts">
	import {type Message} from "./aione";
	type MessageProps = {
		message: Message;
	};
	
	let { message }: MessageProps = $props();
</script>

<article class={message.role}>
	<strong>{message.role === "user" ? "You" : "AIOne"}</strong>

	{#if message.thinking}
		<details class="thinking">
			<summary>Thinking</summary>
			<p>{message.thinking}</p>
		</details>
	{/if}

	{#if message.content}
		<p>{message.content}</p>
	{/if}

	{#if message.stats}
		<p class="stats">
			{message.stats.generatedTokens} tokens · {message.stats.tokensPerSecond.toFixed(1)} t/s
			{#if message.stats.promptTokens > 0}
				· prompt {message.stats.promptTokens} @ {message.stats.promptTokensPerSecond.toFixed(1)} t/s
			{/if}
		</p>
	{/if}
</article>

<style>
    article {
        max-width: 80%;
        padding: 0.75rem 1rem;
        border-radius: calc(var(--message-box-size) / 2);
        background: #292929;
        color: white;
        align-self: flex-start;
        overflow-wrap: anywhere;
    }

    article.user {
        align-self: flex-end;
        background: var(--accent-gradient);
        border-bottom-right-radius: 0.25rem;
    }

    article:not(.user) {
        border-bottom-left-radius: 0.25rem;
    }

    p {
        margin: 0.4rem 0 0;
        white-space: pre-wrap;
    }

    .thinking {
        margin-top: 0.5rem;
        padding: 0.5rem 0.65rem;
        border-radius: 0.6rem;
        background: #1d1d1d;
        color: #b9b9b9;
        font-size: 0.9em;
    }

    .thinking summary {
        cursor: pointer;
        color: #e0e0e0;
        font-weight: 600;
    }

    .thinking p {
        white-space: pre-wrap;
    }

    .stats {
        color: #9a9a9a;
        font-size: 0.75rem;
        font-variant-numeric: tabular-nums;
    }
</style>
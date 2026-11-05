<script lang="ts">
	import type { ChatNode } from "./chat";

	type MessageProps = {
		message: ChatNode;
		id?: string;
		versionIndex?: number;
		versionCount?: number;
		regenerating?: boolean;
		disabled?: boolean;
		onregenerate?: (message: ChatNode) => void;
		onversion?: (message: ChatNode, direction: -1 | 1) => void;
	};

	let {
		message,
		id,
		versionIndex = 0,
		versionCount = 1,
		regenerating = false,
		disabled = false,
		onregenerate,
		onversion
	}: MessageProps = $props();
</script>

<article {id} class={message.role}>
	<strong>{message.role === "user" ? "You" : "AIOne"}</strong>

	{#if message.thinking}
		<details class="thinking">
			<summary>Thinking</summary>
			<p>{message.thinking}</p>
		</details>
	{/if}

	{#if message.content}
		<Markdown content={message.content}/>
		<p>{message.content}</p>
	{/if}

	{#if message.stats}
		<p class="stats">
			{message.stats.generatedTokens} tokens · {message.stats.tokensPerSecond.toFixed(1)} t/s
			{#if message.stats.evaluatedTokens > 0}
				· prompt {message.stats.promptTokens} tokens{#if message.stats.cachedTokens > 0}
					({message.stats.cachedTokens} cached){/if}
				· prefill {message.stats.promptTokensPerSecond.toFixed(1)} t/s
			{/if}
		</p>
	{/if}

	{#if message.role === "assistant" || versionCount > 1}
		<div class="actions">
			{#if versionCount > 1}
				<div class="versions">
					<button
						type="button"
						class="icon"
						aria-label="Previous version"
						title="Previous version"
						disabled={disabled}
						onclick={() => onversion?.(message, -1)}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path
								d="M15 6l-6 6 6 6"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>
					<span class="count">{versionIndex + 1}/{versionCount}</span>
					<button
						type="button"
						class="icon"
						aria-label="Next version"
						title="Next version"
						disabled={disabled}
						onclick={() => onversion?.(message, 1)}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path
								d="M9 6l6 6-6 6"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>
				</div>
			{/if}

			{#if message.role === "assistant"}
				<button
					type="button"
					class="regenerate"
					title="Regenerate this message"
					disabled={disabled || regenerating}
					onclick={() => onregenerate?.(message)}
				>
					{#if regenerating}
						<span class="spinner" aria-hidden="true"></span>
					{:else}
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path
								d="M20 11a8 8 0 1 0-.8 4.7"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
							/>
							<path
								d="M20 5v6h-6"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					{/if}
					<span>Regenerate</span>
				</button>
			{/if}
		</div>
	{/if}
</article>

<style>
    article {
        max-width: 80%;
        padding: 0.75rem 1rem;
        border-radius: calc(var(--message-box-size) / 2);
        background: var(--chat-bubble-bg);
        /* color: white; */
        align-self: flex-start;
        overflow-wrap: anywhere;
    }

    article.user {
        align-self: flex-end;
        color: white;
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

    .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-top: 8px;
        color: #b9b9b9;
    }

    .versions {
        display: flex;
        align-items: center;
        gap: 2px;
    }

    .count {
        min-width: 2.4em;
        text-align: center;
        font-size: 0.75rem;
        font-variant-numeric: tabular-nums;
    }

    .actions button {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 6px;
        border-radius: 6px;
        background: #ffffff0d;
        color: inherit;
        font: inherit;
        font-size: 0.75rem;
        line-height: 1;
    }

    .actions button:hover:not(:disabled) {
        background: #ffffff1f;
        color: #fff;
    }

    .actions button:disabled {
        opacity: 0.5;
        cursor: default;
    }

    .actions .icon {
        padding: 3px;
    }

    .actions svg {
        width: 15px;
        height: 15px;
    }

    .spinner {
        width: 13px;
        height: 13px;
        box-sizing: border-box;
        border: 2px solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
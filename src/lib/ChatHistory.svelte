<script lang="ts">
	import type { Message } from "aione-web";

	type Props = {
		messages: Message[];
	};

	let { messages }: Props = $props();

	let turns = $derived(
		messages
			.map((message, index) => ({ message, index }))
			.filter(({ message }) => message.role === "user")
	);

	function scrollTo(index: number) {
		document.getElementById(`message-${index}`)?.scrollIntoView({
			behavior: "smooth",
			block: "start"
		});
	}
</script>

<nav class="chat-history" aria-label="Chat history">
	{#if turns.length === 0}
		<p class="empty">Your messages will appear here.</p>
	{:else}
		<ol>
			{#each turns as turn, position}
				<li>
					<button type="button" onclick={() => scrollTo(turn.index)}>
						<span class="position">{position + 1}</span>
						<span class="preview">{turn.message.content}</span>
					</button>
				</li>
			{/each}
		</ol>
	{/if}
</nav>

<style>
	.chat-history {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		scrollbar-gutter: stable;
	}

	ol {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	button {
		display: flex;
		gap: 8px;
		align-items: baseline;
		width: 100%;
		padding: 8px 10px;
		background: none;
		border-radius: 8px;
		color: #cfcfcf;
		font: inherit;
		font-size: 0.85rem;
		text-align: left;
	}

	button:hover {
		background: #ffffff0d;
	}

	.position {
		flex: none;
		min-width: 1.2em;
		color: #7d7d7d;
		font-variant-numeric: tabular-nums;
	}

	.preview {
		min-width: 0;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.empty {
		margin: 4px 0 0;
		padding: 0 10px;
		color: #7d7d7d;
		font-size: 0.85rem;
	}
</style>

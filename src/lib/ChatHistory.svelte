<script lang="ts">
	import { MarkdownRenderer } from "svelte-md-parser";
	import type { ChatMetadata } from "./aione-native";

	type Props = {
		chats: ChatMetadata[];
		currentFolder: string | null;
		onselect: (folder: string) => void;
		onnew: () => void;
		ondelete: (folder: string) => void;
	};

	let { chats, currentFolder, onselect, onnew, ondelete }: Props = $props();

	function formatDate(value: number) {
		return new Date(value).toLocaleDateString(undefined, {
			month: "short",
			day: "numeric"
		});
	}
</script>

<nav class="chat-history" aria-label="Chat history">
	<button type="button" class="new-chat" onclick={onnew}>+ New chat</button>

	{#if chats.length === 0}
		<p class="empty">No saved chats yet.</p>
	{:else}
		<ol>
			{#each chats as chat}
				<li class:active={chat.folder === currentFolder}>
					<button type="button" class="chat" onclick={() => onselect(chat.folder)}>
						<span class="preview"><MarkdownRenderer content={chat.title || "Untitled"}/></span>
						<span class="date">{formatDate(chat.updated)}</span>
					</button>
					<button
						type="button"
						class="delete"
						aria-label={`Delete ${chat.title || "chat"}`}
						onclick={() => ondelete(chat.folder)}
					>
						×
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
	}

	ol {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		align-items: stretch;
		gap: 2px;
		border-radius: 8px;
	}

	li.active {
		background: var(--surface-active);
	}

	button {
		display: flex;
		gap: 8px;
		align-items: baseline;
		width: 100%;
		padding: 8px 10px;
		background: none;
		border-radius: 8px;
		font: inherit;
		font-size: 0.85rem;
		text-align: left;
	}

	.new-chat {
		justify-content: center;
		margin-bottom: 8px;
		background: var(--surface);
	}

	.chat {
		flex: 1;
		min-width: 0;
		flex-direction: column;
		gap: 2px;
	}

	.delete {
		flex: none;
		width: 28px;
		padding: 0;
		justify-content: center;
		color: var(--muted);
		font-size: 1rem;
		opacity: 0;
	}

	li:hover .delete,
	li.active .delete {
		opacity: 1;
	}

	.delete:hover {
		color: var(--danger);
		background: var(--surface-active);
	}

	.preview {
		min-width: 0;
		max-width: 100%;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;

		height: 1.3em;
		line-height: 1.3em;
	}

	:global(.preview *) {
		max-width: 100%;
		display: inline-block;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;

		padding: 0;
		margin: 0;
		height: 1.3em;
		line-height: 1.3em;
	}

	span {
		line-height: 1em;
	}

	.date {
		flex: none;
		color: var(--muted);
		font-size: 0.72rem;
	}

	.empty {
		margin: 4px 0 0;
		padding: 0 10px;
		color: var(--muted);
		font-size: 0.85rem;
	}
</style>

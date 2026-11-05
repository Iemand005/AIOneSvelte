<script lang="ts">
    import MarkdownRenderer from "../../../../SvelteMDParser/dist/MarkdownRenderer.svelte";
	import type { ChatMetadata } from "./aione-native";
	import type { ChatNode } from "./chat";

	type Props = {
		chats: ChatMetadata[];
		currentFolder: string | null;
		persist: boolean;
		messages: ChatNode[];
		onselect: (folder: string) => void;
		onnew: () => void;
		ondelete: (folder: string) => void;
	};

	let { chats, currentFolder, persist, messages, onselect, onnew, ondelete }: Props = $props();

	let turns = $derived(messages.filter(message => message.role === "user"));

	function scrollTo(id: string) {
		document.getElementById(`message-${id}`)?.scrollIntoView({
			behavior: "smooth",
			block: "start"
		});
	}

	function formatDate(value: number) {
		return new Date(value).toLocaleDateString(undefined, {
			month: "short",
			day: "numeric"
		});
	}
</script>

<nav class="chat-history" aria-label="Chat history">
	{#if persist}
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
	{:else if turns.length === 0}
		<p class="empty">Your messages will appear here.</p>
	{:else}
		<ol>
			{#each turns as turn, position}
				<li>
					<button type="button" onclick={() => scrollTo(turn.id)}>
						<span class="position">{position + 1}</span>
						<span class="preview">{turn.content}</span>
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

	li {
		display: flex;
		align-items: stretch;
		gap: 2px;
		border-radius: 8px;
	}

	li.active {
		background: #ffffff14;
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

	button:hover {
		background: #52525233;
	}

	.new-chat {
		justify-content: center;
		margin-bottom: 8px;
		background: #5252521c;
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
		color: #8a8a8a;
		font-size: 1rem;
		opacity: 0;
	}

	li:hover .delete,
	li.active .delete {
		opacity: 1;
	}

	.delete:hover {
		color: #ff8a7a;
		background: #ffffff14;
	}

	.position {
		flex: none;
		min-width: 1.2em;
		color: #7d7d7d;
		font-variant-numeric: tabular-nums;
	}

	.preview {
		min-width: 0;
		max-width: 100%;;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	:global(.preview *) {
		max-width: 100%;
		display: inline-block	;
		text-overflow: ellipsis;
    overflow: hidden;
	}

	.date {
		flex: none;
		color: #7d7d7d;
		font-size: 0.72rem;
	}

	.empty {
		margin: 4px 0 0;
		padding: 0 10px;
		color: #7d7d7d;
		font-size: 0.85rem;
	}
</style>

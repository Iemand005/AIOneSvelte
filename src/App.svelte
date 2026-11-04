<script lang="ts">
	import type { Message } from "aione-web";
	import { initializeAIOne, type Backend } from "./lib/aione";
	import ModelLoader from "./lib/ModelLoader.svelte";
	import ChatBox from "./lib/ChatBox.svelte";
	import ChatHistory from "./lib/ChatHistory.svelte";
	import SystemPrompt from "./lib/SystemPrompt.svelte";

	if (window.__TAURI_INTERNALS__) {
		document.documentElement.dataset.tauri = "";
	}

	let ai: Backend | null = $state(null);

	let loading = $state(false);
	let systemPrompt = $state("");
	let messages = $state<Message[]>([]);
	let promptOpen = $state(true);

	let hasSystemPrompt = $derived(systemPrompt.trim().length > 0);

	initializeAIOne().then(one => ai = one);
</script>

<svelte:head>
	<title>AIOne Chat</title>
	<meta name="description" content="Chat with local AI models using AIOne." />
</svelte:head>

<main class="layout" class:prompt-collapsed={!promptOpen}>
	<aside class="history" aria-label="Chat history">
		<div class="aside-header">
			<h2>History</h2>
		</div>

		<ChatHistory {messages} />
	</aside>

	<section class="workspace">
		<header>
			<ModelLoader {ai} bind:loading />
		</header>

		<div class="chat-area">
			<ChatBox {ai} bind:loading bind:systemPrompt bind:messages />
		</div>
	</section>

	<aside class="prompt" class:collapsed={!promptOpen} aria-label="System prompt">
		<div class="aside-header">
			{#if promptOpen}
				<h2>
					System prompt
					{#if hasSystemPrompt}
						<span class="indicator" aria-label="active"></span>
					{/if}
				</h2>
			{/if}

			<button
				type="button"
				class="collapse"
				aria-expanded={promptOpen}
				aria-label={promptOpen ? "Collapse system prompt" : "Expand system prompt"}
				onclick={() => (promptOpen = !promptOpen)}
			>
				<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
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

		{#if promptOpen}
			<SystemPrompt bind:systemPrompt />
		{/if}
	</aside>
</main>

<style>
	.layout {
		--history-width: 220px;
		--prompt-width: 320px;
		--aside-border: #ffffff14;

		display: grid;
		grid-template-columns:
			minmax(160px, var(--history-width))
			minmax(0, 1fr)
			minmax(260px, var(--prompt-width));
		width: 100%;
		height: 100dvh;
		overflow: hidden;
		color: #eee;
	}

	.layout.prompt-collapsed {
		grid-template-columns:
			minmax(160px, var(--history-width))
			minmax(0, 1fr)
			56px;
	}

	aside {
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-height: 0;
		overflow: hidden;
		background: rgba(18, 16, 15, 0.6);
		backdrop-filter: blur(20px);
	}

	.history {
		padding: 16px 12px;
		border-right: 1px solid var(--aside-border);
	}

	.prompt {
		padding: 16px 12px;
		border-left: 1px solid var(--aside-border);
	}

	.prompt.collapsed {
		padding-inline: 6px;
	}

	.prompt.collapsed .aside-header {
		justify-content: center;
	}

	.aside-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		min-height: 32px;
	}

	.aside-header h2 {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 0;
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #b8b8b8;
	}

	.indicator {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--accent-gradient);
	}

	.collapse {
		display: grid;
		place-items: center;
		flex: none;
		width: 32px;
		height: 32px;
		padding: 0;
		border-radius: 8px;
		background: #ffffff0d;
		color: #cfcfcf;
		transition: background-color 120ms ease, color 120ms ease;
	}

	.collapse:hover {
		background: #ffffff1a;
		color: #fff;
	}

	.collapse svg {
		transition: transform 160ms ease;
	}

	.prompt.collapsed .collapse svg {
		transform: rotate(180deg);
	}

	.workspace {
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
	}

	header {
		display: flex;
		align-items: stretch;
		padding: 12px var(--chatbox-pad);
	}

	.chat-area {
		position: relative;
		flex: 1;
		min-height: 0;
	}
</style>

<script lang="ts">
	import { initializeAIOne, type Backend } from "./lib/aione";
	import type { ChatMetadata } from "./lib/aione-native";
	import {
		buildActivePath,
		nodesFromPersisted,
		type ChatNode,
		type VersionSelections
	} from "./lib/chat";
	import ModelLoader from "./lib/ModelLoader.svelte";
	import ChatBox from "./lib/ChatBox.svelte";
	import ChatHistory from "./lib/ChatHistory.svelte";
	import Settings from "./lib/Settings.svelte";
	import SystemPrompt from "./lib/SystemPrompt.svelte";

	if (window.__TAURI_INTERNALS__) {
		document.documentElement.dataset.tauri = "";
	}

	let ai: Backend | null = $state(null);

	let modelLoading = $state(false);
	let systemPrompt = $state("");
	let messages = $state<ChatNode[]>([]);
	let versionSelections = $state<VersionSelections>({});
	let chats = $state<ChatMetadata[]>([]);
	let currentFolder = $state<string | null>(null);
	let native = $state(false);
	let promptOpen = $state(true);
	let view = $state<"chat" | "settings">("chat");

	let hasSystemPrompt = $derived(systemPrompt.trim().length > 0);
	let activeMessages = $derived(buildActivePath(messages, versionSelections));

	initializeAIOne().then(async one => {
		ai = one;
		native = one.kind === "native";
		if (native) await refreshChats();
	});

	async function refreshChats() {
		if (!ai || ai.kind !== "native") return;

		try {
			const { listChats } = await import("./lib/aione-native");
			chats = (await listChats()).sort((left, right) => right.updated - left.updated);
		} catch (error) {
			console.error(error);
		}
	}

	async function openChat(folder: string) {
		try {
			const { loadChat } = await import("./lib/aione-native");
			const chat = await loadChat(folder);

			view = "chat";
			currentFolder = chat.folder;
			systemPrompt = chat.systemPrompt;
			messages = nodesFromPersisted(chat.messages);
			const pathIds = new Set(chat.activePath);
			versionSelections = Object.fromEntries(
				messages
					.filter(message => message.nativeId !== undefined && pathIds.has(message.nativeId))
					.map(message => [message.parentId ?? "__root__", message.id])
			);
		} catch (error) {
			console.error(error);
		}
	}

	async function newChat() {
		view = "chat";
		currentFolder = null;
		messages = [];
		versionSelections = {};
		systemPrompt = "";

		if (!native) return;

		try {
			const { createChat } = await import("./lib/aione-native");
			const chat = await createChat("New chat", "", "");
			currentFolder = chat.folder;
			chats = [chat, ...chats.filter(item => item.folder !== chat.folder)];
		} catch (error) {
			console.error(error);
		}
	}

	async function deleteChat(folder: string) {
		return;
		try {
			const { deleteChat: removeChat } = await import("./lib/aione-native");
			// await removeChat(folder);

			if (currentFolder === folder) newChat();
			await refreshChats();
		} catch (error) {
			console.error(error);
		}
	}

	function onChatCreated(chat: ChatMetadata) {
		currentFolder = chat.folder;
		void refreshChats();
	}

	$effect(() => {
		const folder = currentFolder;
		const value = systemPrompt;

		if (!native || !folder) return;

		const timer = setTimeout(() => {
			import("./lib/aione-native")
				.then(({ updateChatMetadata }) => updateChatMetadata(folder, null, null, value))
				.catch(console.error);
		}, 500);

		return () => clearTimeout(timer);
	});
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

		<ChatHistory
			{chats}
			{currentFolder}
			persist={native}
			messages={activeMessages}
			onselect={openChat}
			onnew={newChat}
			ondelete={deleteChat}
		/>

		<button
			type="button"
			class="settings-button"
			class:active={view === "settings"}
			aria-pressed={view === "settings"}
			onclick={() => (view = view === "settings" ? "chat" : "settings")}
		>
			<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
				<path
					d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
				/>
				<path
					d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.64 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z"
					fill="none"
					stroke="currentColor"
					stroke-width="1.4"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			Settings
		</button>
	</aside>

	<section class="workspace">
		<header>
			<ModelLoader {ai} bind:loading={modelLoading} />
		</header>

		<div class="chat-area">
			<div class="view" hidden={view !== "chat"}>
				<ChatBox
					{ai}
					modelLoading={modelLoading}
					bind:systemPrompt
					bind:messages
					bind:versionSelections
					bind:chatFolder={currentFolder}
					onchatcreated={onChatCreated}
					onpersisted={refreshChats}
				/>
			</div>

			{#if view === "settings"}
				<Settings onback={() => (view = "chat")} />
			{/if}
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
		--history-width: clamp(150px, 22vw, 240px);
		--prompt-width: clamp(240px, 28vw, 340px);

		display: grid;
		grid-template-columns: var(--history-width) minmax(0, 1fr) var(--prompt-width);
		width: 100%;
		height: 100dvh;
		overflow: hidden;
	}

	.layout.prompt-collapsed {
		grid-template-columns: var(--history-width) minmax(0, 1fr) 56px;
	}

	aside {
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-height: 0;
		overflow: hidden;
		background: var(--sidebar);
		backdrop-filter: blur(20px);

		border-top: 1px solid var(--border);
	}

	.history {
		padding: 16px 12px;
		border-right: 1px solid var(--border);
	}

	.settings-button {
		display: flex;
		flex: none;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 8px 10px;
		background: #5252521c;
		border-radius: 8px;
		font: inherit;
		font-size: 0.85rem;
		text-align: left;
		color: var(--text);
	}

	.settings-button:hover {
		background: #52525233;
	}

	.settings-button.active {
		background: #ffffff14;
		color: var(--text-h);
	}

	.prompt {
		padding: 16px 12px;
		border-left: 1px solid var(--border);
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
		color: var(--text);
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

	.view {
		height: 100%;
	}
</style>

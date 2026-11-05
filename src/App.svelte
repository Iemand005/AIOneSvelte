<script lang="ts">
	import { initializeAIOne, type Backend } from "./lib/aione";
	import type { ChatMetadata } from "./lib/aione-native";
	import { nodesFromPersisted, type ChatNode, type VersionSelections } from "./lib/chat";
	import ModelLoader from "./lib/ModelLoader.svelte";
	import ChatBox from "./lib/ChatBox.svelte";
	import ChatHistory from "./lib/ChatHistory.svelte";
	import Settings from "./lib/Settings.svelte";
	import SystemPrompt from "./lib/SystemPrompt.svelte";
	import Sidebar from "./lib/Sidebar.svelte";

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
	let promptOpen = $state(true);
	let historyOpen = $state(true);
	let outputTokens = $state(512);
	let historyWidth = $state(220);
	let promptWidth = $state(300);
	let view = $state<"chat" | "settings">("chat");

	initializeAIOne().then(async one => {
		ai = one;
		await refreshChats();
	});

	async function refreshChats() {
		if (!ai) return;

		try {
			const { listChats } = ai.kind === "native"
				? await import("./lib/aione-native")
				: await import("./lib/browser-chat-store");
			chats = (await listChats()).sort((left, right) => right.updated - left.updated);
		} catch (error) {
			console.error(error);
		}
	}

	async function openChat(folder: string) {
		try {
			if (!ai) return;
			const { loadChat } = ai.kind === "native"
				? await import("./lib/aione-native")
				: await import("./lib/browser-chat-store");
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

		try {
			if (!ai) return;
			const { createChat } = ai.kind === "native"
				? await import("./lib/aione-native")
				: await import("./lib/browser-chat-store");
			const chat = await createChat("New chat", "", "");
			currentFolder = chat.folder;
			chats = [chat, ...chats.filter(item => item.folder !== chat.folder)];
		} catch (error) {
			console.error(error);
		}
	}

	async function deleteChat(folder: string) {
		try {
			if (!ai) return;
			const { deleteChat: removeChat } = ai.kind === "native"
				? await import("./lib/aione-native")
				: await import("./lib/browser-chat-store");
			await removeChat(folder);

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
		const backend = ai;

		if (!folder || !backend) return;

		const timer = setTimeout(() => {
			(backend.kind === "native"
				? import("./lib/aione-native")
				: import("./lib/browser-chat-store"))
				.then(({ updateChatMetadata }) => updateChatMetadata(folder, null, null, value))
				.catch(console.error);
		}, 500);

		return () => clearTimeout(timer);
	});
</script>

<svelte:head>
	<title>AIOne</title>
	<meta name="description" content="Chat with local AI models using AIOne." />
</svelte:head>

<main class="layout">
	<Sidebar title="History" side="left" bind:width={historyWidth} bind:collapsed={historyOpen}>
		<ChatHistory
			{chats}
			{currentFolder}
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
			Settings
		</button>
	</Sidebar>

	<section class="workspace">
		<header>
			<ModelLoader {ai} bind:loading={modelLoading} />
		</header>

		<div class="chat-area">
			<div class="view" hidden={view !== "chat"}>
				<ChatBox
					{ai}
					modelLoading={modelLoading}
					{outputTokens}
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

	<Sidebar title="Prompt & generation" side="right" bind:width={promptWidth} bind:collapsed={promptOpen}>
		<SystemPrompt bind:systemPrompt />
		<section class="generation-options">
			<h2>Generation</h2>
			<label for="output-tokens">Maximum output tokens: {outputTokens}</label>
			<input id="output-tokens" type="range" min="64" max="2048" step="64" bind:value={outputTokens} />
		</section>
	</Sidebar>
</main>

<style>
	.layout {
		display: flex;
		width: 100%;
		height: 100dvh;
		overflow: hidden;
	}

	.workspace {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
	}

	.settings-button {
		display: flex;
		flex: none;
		align-items: center;
		gap: 8px;
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

	.generation-options {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding-top: 12px;
		border-top: 1px solid var(--border);
	}

	.generation-options h2 {
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text);
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

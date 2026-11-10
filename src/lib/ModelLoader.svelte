<script lang="ts">
	import type { Backend, ModelSource } from "./backend";
	import FileButton from "./FileButton.svelte";
    import Icon from "./Icon.svelte";

	type Props = {
		ai: Backend | null;
		loading?: boolean;
		onerror?: (error: unknown) => void;
	};

	let {
		ai = $bindable(null),
		loading = $bindable(false),
		onerror
	}: Props = $props();

	let loaded = $state(false);
	let progress = $state(0);
	let dragActive = $state(false);
	let modelName = $state<string | null>(null);
	let noHost = $state(false);
	let contextLength = $state(4096);
	let settingsOpen = $state(false);
	let settingsRoot = $state<HTMLElement | null>(null);

	function closeSettings(event: PointerEvent) {
		if (!settingsOpen) return;
		const target = event.target;
		if (target instanceof Node && settingsRoot?.contains(target)) return;
		settingsOpen = false;
	}

	function sourceName(src: ModelSource) {
		if (src.kind === "file") return src.file.name;
		if (src.kind === "path") return src.path.split(/[\\/]/).pop() ?? src.path;
		return src.url;
	}

	async function loadModel(src: ModelSource) {
		modelName = sourceName(src);
		if (!ai) return;

		loading = true;
		progress = 0;

		try {
			await ai.loadModel(src, value => (progress = value), {
				noHost,
				contextLength: Number(contextLength) || 4096
			});
			loaded = true;
		} catch (error) {
			onerror?.(error);
		} finally {
			loading = false;
			progress = 0;
		}
	}

	async function unloadModel() {
		try {
			await ai?.unloadModel();
		} catch (error) {
			onerror?.(error);
		} finally {
			loaded = false;
			modelName = null;
		}
	}

	function pickPath(path: string) {
		void loadModel({ kind: "path", path });
	}

	function pickFile(file: File) {
		if (file.name.toLowerCase().endsWith(".gguf")) {
			void loadModel({ kind: "file", file });
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		dragActive = true;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragActive = false;
		const file = [...(event.dataTransfer?.files ?? [])].find(item =>
			item.name.toLowerCase().endsWith(".gguf")
		);
		if (file) pickFile(file);
	}

	function handleDragLeave(event: DragEvent) {
		if (!event.relatedTarget) dragActive = false;
	}

	$effect(() => {
		if (ai?.kind !== "native") return;
		let active = true;
		let unlisten: (() => void) | undefined;
		void import("@tauri-apps/api/webview").then(({ getCurrentWebview }) =>
			getCurrentWebview().onDragDropEvent(event => {
				if (event.payload.type === "enter") {
					dragActive = event.payload.paths.some(path => path.toLowerCase().endsWith(".gguf"));
					return;
				}
				if (event.payload.type === "over") return;
				if (event.payload.type === "leave") {
					dragActive = false;
					return;
				}
				dragActive = false;
				const path = event.payload.paths.find(item => item.toLowerCase().endsWith(".gguf"));
				if (path) void loadModel({ kind: "path", path });
			}).then(dispose => {
				if (active) unlisten = dispose;
				else dispose();
			})
		).catch(error => onerror?.(error));
		return () => {
			active = false;
			unlisten?.();
		};
	});
</script>

<svelte:window
	ondragover={handleDragOver}
	ondrop={handleDrop}
	ondragleave={handleDragLeave}
	onpointerdown={closeSettings}
/>

{#if dragActive}
	<div class="drop-overlay" aria-live="polite">
		<div class="drop-message">
			<strong>Drop to load model</strong>
			<span>GGUF files only</span>
		</div>
	</div>
{/if}

<div class="loader" bind:this={settingsRoot}>
	<form>
		<FileButton
			{ai}
			label={ai?.kind === "native" ? "Choose model." : "Choose model file!"}
			value={modelName}
			class="model-button"
			active={ai?.kind !== "native" && loaded}
			filterName="Model"
			onfile={pickFile}
			onpath={pickPath}
		/>

		{#if ai?.kind === "native"}
			<button
				type="button"
				class="settings-toggle"
				class:active={settingsOpen}
				aria-label="Model loading settings"
				aria-expanded={settingsOpen}
				title="Model loading settings"
				onclick={() => (settingsOpen = !settingsOpen)}
			>
				<Icon/>
			</button>
		{/if}

		<button type="button" class="unload" onclick={unloadModel} disabled={!loaded}>Eject</button>

		{#if loading}
			<progress class="progress" value={Math.round(progress * 100)} max="100"></progress>
		{/if}
	</form>

	{#if ai?.kind === "native" && settingsOpen}
		<div class="settings-menu" role="dialog" aria-label="Model loading settings">
			<div class="settings-heading">
				<strong>Model loading</strong>
				<span>Applied on next load</span>
			</div>

			<label class="setting-row">
				<span>
					<strong>VRAM only</strong>
					<small>Don't keep a copy of the model in RAM</small>
				</span>
				<input type="checkbox" bind:checked={noHost} disabled={loading} />
			</label>

			<label class="setting-row">
				<span>
					<strong>Context length</strong>
					<small>Tokens the model can see at once</small>
				</span>
				<input
					class="number"
					type="number"
					min="512"
					max="131072"
					step="512"
					bind:value={contextLength}
					disabled={loading}
				/>
			</label>
		</div>
	{/if}
</div>

<style>
	:global(.model-button.active) {
		background-color: green;
	}

	.loader {
		position: relative;
		display: flex;
		flex: 1;
		min-width: 0;
	}

	form {
		display: flex;
		flex: 1;
		position: relative;
		padding: 0;
		border-radius: 10px;
		overflow: hidden;
	}

	form > * {
		margin-block: 0;
		align-self: stretch;
	}

	:global(.model-button) {
		flex: 1;
		min-width: 0;
		border-radius: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	button {
		margin-left: 1px;
		border-radius: 0;
	}

	button:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.settings-toggle {
		display: grid;
		place-items: center;
		flex: none;
		width: 44px;
		padding: 0;
		color: var(--muted);
	}

	.settings-toggle:hover,
	.settings-toggle.active {
		color: var(--text-h);
		background: var(--surface-hover);
	}

	.settings-menu {
		position: absolute;
		z-index: 30;
		top: calc(100% + 8px);
		right: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
		width: min(310px, calc(100vw - 32px));
		padding: 14px;
		border: 1px solid var(--border);
		border-radius: 12px;
		background: var(--code-bg);
		box-shadow: 0 18px 50px rgb(0 0 0 / 28%);
		box-sizing: border-box;
	}

	.settings-heading {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.settings-heading strong {
		color: var(--text-h);
		font-size: 0.9rem;
	}

	.settings-heading span,
	.setting-row small {
		color: var(--muted);
		font-size: 0.75rem;
	}

	.setting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		cursor: pointer;
	}

	.setting-row > span {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.setting-row strong {
		color: var(--text-h);
		font-size: 0.82rem;
		font-weight: 500;
	}

	.setting-row input[type="checkbox"] {
		flex: none;
		width: 17px;
		height: 17px;
		accent-color: var(--focus);
		cursor: pointer;
	}

	.setting-row .number {
		width: 96px;
		padding: 7px 8px;
		border: 1px solid var(--border);
		border-radius: 7px;
		background: var(--surface);
		color: var(--text-h);
		font: inherit;
		font-size: 0.82rem;
		box-sizing: border-box;
	}

	.setting-row .number:focus {
		outline: none;
		border-color: var(--focus);
	}

	.setting-row input:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.drop-overlay {
		position: fixed;
		z-index: 1000;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 24px;
		background: color-mix(in srgb, var(--bg) 82%, transparent);
		backdrop-filter: blur(6px);
		pointer-events: none;
	}

	.drop-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 32px 48px;
		border: 2px dashed var(--border);
		border-radius: 18px;
		background: var(--sidebar);
		color: var(--text-h);
		text-align: center;
	}

	.drop-message strong {
		font-size: 1.2rem;
	}

	.drop-message span {
		color: var(--text);
		font-size: 0.9rem;
	}

	progress {
		position: absolute;
		inset: auto 0 0 0;
		height: 5px !important;
		width: 100%;
		background: var(--progress-track);
		pointer-events: none;
		z-index: 2;
	}
</style>

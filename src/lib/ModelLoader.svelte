<script lang="ts">
	import type { Backend, ModelSource } from "./backend";

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
			await ai.loadModel(src, value => (progress = value));
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

	async function pickNative() {
		const { open } = await import("@tauri-apps/plugin-dialog");
		const path = await open({
			multiple: false,
			directory: false,
			filters: [{ name: "Model", extensions: ["gguf"] }]
		});
		if (typeof path === "string") void loadModel({ kind: "path", path });
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

<svelte:window ondragover={handleDragOver} ondrop={handleDrop} ondragleave={handleDragLeave} />

{#if dragActive}
	<div class="drop-overlay" aria-live="polite">
		<div class="drop-message">
			<strong>Drop to load model</strong>
			<span>GGUF files only</span>
		</div>
	</div>
{/if}

<form>
	{#if ai?.kind === "native"}
		<button type="button" onclick={pickNative}>{modelName ?? "Choose model…"}</button>
	{:else}
		<label for="model-file" class="button model-button" class:active={loaded}>
			{modelName ?? "Choose model file!"}
		</label>
		<input
			id="model-file"
			type="file"
			accept=".gguf"
			hidden
			onchange={event => {
				const file = event.currentTarget.files?.[0];
				if (file) pickFile(file);
			}}
		/>
	{/if}

	<button type="button" class="unload" onclick={unloadModel} disabled={!loaded}>Eject</button>

	{#if loading}
		<progress class="progress" value={Math.round(progress * 100)} max="100"></progress>
	{/if}
</form>

<style>
	label.active {
		background-color: green;
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

	.model-button {
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

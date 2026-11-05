<script lang="ts">
	import type AIOne from "aione-web";
	import FileButton from "./FileButton.svelte";
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

	async function loadModel(src: ModelSource) {
		if (!ai) return;

		loading = true;
		progress = 0;
		
		console.log(ai.kind)

		try {
			console.log(src)

			await ai.loadModel(src, value => {
				progress = value;
				console.log(value);
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
		}
	}

	 async function pickNative() {
		const { open } = await import("@tauri-apps/plugin-dialog");
		const path = await open({
		multiple: false,
		directory: false,
		filters: [{ name: "Model", extensions: ["gguf"] }],  // your format
		});
		if (typeof path === "string") loadModel({ kind: "path", path });
	}

	function pickWeb(file: File) {
		if (file && file.name.toLowerCase().endsWith(".gguf")) {
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
		if (file) pickWeb(file);
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

<form class="card">
	{#if ai?.kind === "native"}
	<button type="button" onclick={pickNative}>Choose model…</button>
	{:else}
	<FileButton class={loaded ? "active model-button" : "model-button"} onselect={pickWeb} />
	{/if}
	<button type="button" class="unload button" onclick={unloadModel} disabled={!loaded}>
		Eject
	</button>

	{#if loading}
		<progress class="progress" value={Math.round(progress * 100)} max="100">
		</progress>
	{/if}
</form>

<style>
	:global(label.active) {
		background-color: green;
	}

	:global(.model-button) {
		border-radius: 0;
	}

	form {
		flex: 1;

		display: flex;
		position: relative;

		padding: 0;

		border-radius: 10px;
		overflow: hidden;

		flex-direction: row;
		align-items: stretch;
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
		background: #00000080;
		pointer-events: none;
		z-index: 2;
	}

	form > * {
		/* height: 100%; */
		height: auto;
		/* min-height: 0; */
		margin-block: 0;
		align-self: stretch;
	}

	form > *:nth-child(1) {
		width: 100%;
	}

	button {
		/* border-left: 1px solid black; */
		margin-left: 1px;
		border-radius: 0;
	}
</style>
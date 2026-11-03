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
		if (file) loadModel({ kind: "file", file });
	}
</script>

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
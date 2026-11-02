<script lang="ts">
	import type AIOne from "aione-web";
	import FileButton from "./FileButton.svelte";

	type Props = {
		ai: AIOne | null;
		loading?: boolean;
		onerror?: (error: unknown) => void;
	};

	let {
		ai = $bindable(null),
		loading = $bindable(false),
		onerror
	}: Props = $props();

	let status = $state("No model loaded");

	async function loadModel(file?: File) {
		if (!file) return;

		loading = true;
		status = "Loading model...";

		try {
			await ai?.loadModel(file);
			status = "Model loaded";
		} catch (error) {
			onerror?.(error);
		} finally {
			loading = false;
		}
	}

	async function unloadModel() {
		try {
			await ai?.unloadModel();
		} catch (error) {
			status = error instanceof Error ? error.message : String(error);
			onerror?.(error);
		} finally {
			status = "No model loaded";
		}
	}
</script>

<FileButton onselect={loadModel} />
<button class="unload" onclick={unloadModel} disabled={!ai || loading}>
	Eject
</button>

<p>{status}</p>
<script lang="ts">
	import type AIOne from "aione-web";
	import FileButton from "./FileButton.svelte";

	type ModelLoaderProps = {
		ai: AIOne | null;
		loading?: boolean;
	};

	let {
		ai = $bindable(null),
		loading = $bindable(false)
	}: ModelLoaderProps = $props();

	let status = $state("No model loaded");

	async function loadModel(file?: File) {
		if (!file) return;

		loading = true;
		status = "Loading model...";

		try {
			await ai?.loadModel(file);
			status = "Model loaded";
		} catch (error) {
			status = error instanceof Error ? error.message : String(error);
			closeAIOne();
			ai = null;
		} finally {
			loading = false;
		}
	}

	async function unloadModel() {
		try {
			await ai?.unloadModel();
		} catch (error) {
			status = error instanceof Error ? error.message : String(error);
		} finally {
			closeAIOne();
			ai = null;
			status = "No model loaded";
		}
	}
</script>

<FileButton onselect={loadModel} />
<button class="unload" onclick={unloadModel} disabled={!ai || loading}>
	Eject
</button>

<p>{status}</p>
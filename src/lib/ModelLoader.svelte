<script lang="ts">
    import type AIOne from "aione-web";
    import FileButton from "./FileButton.svelte";

	type ModelLoaderProps = {
		ai: AIOne;
		loading: boolean;
		loaded: boolean;
	};

	let {
		ai,
		loading = $bindable(false)
	}: ModelLoaderProps = $props();

	async function loadModel(file?: File) {
		if (!file) return;

		loading = true;
		status = "Loading model...";

		try {
			await ai.loadModel(file);
			status = "Model loaded";
		} catch (error) {
			status = String(error);
			closeAIOne();
			ai = null;
			} finally {
			loading = false;
		}
	}

	async function unloadModel() {
		await ai?.unloadModel();
		closeAIOne();
		ai = null;
		status = "No model loaded";
		messages = [];
	}

</script>


<FileButton onselect={loadModel}/>
<button class="unload" onclick={unloadModel}>Eject</button>
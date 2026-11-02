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

	let loaded = $state(false);

	async function loadModel(file: File) {
		if (!ai) return;

		loading = true;

		try {
			await ai.loadModel(file);
			loaded = true;
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
			onerror?.(error);
		} finally {
			loaded = false;
		}
	}
</script>

<form class="card">
	<FileButton class={loaded ? "active" : ""} onselect={loadModel} />
	<button type="button" class="unload button" onclick={unloadModel} disabled={!loaded}>
		Eject
	</button>
</form>

<style>
	:global(label.active) {
		background-color: green;
	}

	form {
		flex: 1;

		display: flex;

		padding: 0;

		flex-direction: row;
		align-items: stretch;
	}

	form > * {
		/* height: 100%; */
		height: auto;
		min-height: 0;
		margin-block: 0;
		align-self: stretch;
	}
</style>
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
	let progress = $state(0);

	async function loadModel(file: File) {
		if (!ai) return;

		loading = true;
		progress = 0;

		try {
			await ai.loadModel(file, value => {
				progress = value;
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
</script>

<form class="card">
	<FileButton class={loaded ? "active model-button" : "model-button"} onselect={loadModel} />
	<button type="button" class="unload button" onclick={unloadModel} disabled={!loaded}>
		Eject
	</button>

	{#if loading}
		<div
			class="progress"
			role="progressbar"
			aria-valuemin="0"
			aria-valuemax="100"
			aria-valuenow={Math.round(progress * 100)}
		>
			<div class="progress-fill" style:width={`${Math.round(progress * 100)}%`}></div>
		</div>
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

	.progress {
		position: absolute;
		inset: auto 0 0 0;
		height: 4px;
		background: #00000080;
		pointer-events: none;
		z-index: 2;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, rgb(119 26 20), rgb(224 83 63));
		transition: width 120ms ease-out;
	}

	form > * {
		/* height: 100%; */
		height: auto;
		min-height: 0;
		margin-block: 0;
		align-self: stretch;
	}

	button {
		border-left: 1px solid black;
		border-radius: 0;
	}
</style>
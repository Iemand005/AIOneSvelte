<script lang="ts">
	type FileButtonProps = {
		onselect: (file: File)=>void;
	};

	const { onselect }: FileButtonProps = $props();

	let selectedFile: File | null = $state(null);
</script>

<label id="model-button" for="model-input" class="button">
	{#if !selectedFile}
	Choose model file!
	{:else}
	{selectedFile.name}
	{/if}
</label>
<input
	type="file"
	accept=".gguf"
	name="model-input"
	id="model-input"
	style="display: none;"
	onchange={event => {
		const file = event.currentTarget.files?.[0];
		if (!file) return;
		onselect(file);
		selectedFile = file;
	}}
/>
<script lang="ts">
	type FileButtonProps = {
		onselect: (file: File)=>void;
	};

	const { onselect }: FileButtonProps = $props();

	let file: File | null = null;
</script>

<label id="model-button" for="model-input" class="button">
	{#if !file}
	Choose model file!
	{:else}
	Selected a file
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
		if (file) onselect(file);
	}}
/>
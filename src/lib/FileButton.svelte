<script lang="ts">
	type FileButtonProps = {
		onselect: (file: File)=>void;
	};

	const { onselect }: FileButtonProps = $props();

	let file: File | null = null;
</script>

{#if file}
<label id="model-button" for="model-input" class="button">Choose model file!</label>
{/if}
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
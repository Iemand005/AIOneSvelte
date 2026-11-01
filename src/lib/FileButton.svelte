<script lang="ts">
	type FileButtonProps = {

	};
	
	const { onselect } = $props();

	let file: File | null = null;
</script>

<label id="model-button" for="model-input" class="button">Choose model file!</label>
<input
	type="file"
	accept=".gguf"
	name="model-input"
	id="model-input"
	style="display: none;"
	onchange={event => file = event.currentTarget.files?.[0] ?? null}
/>
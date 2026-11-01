<script lang="ts">
	const { onchange } = $props();

	let file: File | null = null;
</script>

<label id="model-button" for="model-input" class="button">Choose model file!</label>
<input
	type="file"
	accept=".gguf"
	name="model-input"
	id="model-input"
	style="display: none;"
	onchange={onchange}
/>
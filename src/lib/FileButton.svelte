<script lang="ts">
	type Props = {
		onselect: (file: File)=>void;
		class?: string;
		accept?: string;
	};

	const {
		onselect,
		class: className = '',
		accept = ".gguf"
	}: Props = $props();

	let selectedFile: File | null = $state(null);
</script>

<label for="file-input" class={`button ${className}`}>
	{#if !selectedFile}
	Choose model file!
	{:else}
	{selectedFile.name}
	{/if}
</label>
<input
	type="file"
	{accept}
	id="file-input"
	onchange={event => {
		const file = event.currentTarget.files?.[0];
		if (!file) return;
		onselect(file);
		selectedFile = file;
	}}
/>

<style>
	input {
		display: none;
	}
</style>
<script lang="ts">
    import type AIOne from "aione-web";
    import FileButton from "./FileButton.svelte";

	type ModelLoaderProps = {
		ai: AIOne;
	};

	const { ai }: ModelLoaderProps = $state();

</script>


<FileButton onselect={loadModel}/>
<button class="unload" onclick={unloadModel}>Eject</button>
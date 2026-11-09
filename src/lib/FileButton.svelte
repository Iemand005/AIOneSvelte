<script lang="ts">
	import type { Backend } from "./backend";

	type Props = {
		ai: Backend | null;
		label: string;
		value?: string | null;
		accept?: string;
		filterName?: string;
		class?: string;
		active?: boolean;
		disabled?: boolean;
		multiple?: boolean;
		onfile: (file: File) => void;
		onpath: (path: string) => void;
	};

	let {
		ai,
		label,
		value = null,
		accept = ".gguf",
		filterName = "GGUF file",
		class: className = "",
		active = false,
		disabled = false,
		multiple = false,
		onfile,
		onpath
	}: Props = $props();

	async function pickNative() {
		const { open } = await import("@tauri-apps/plugin-dialog");
		const path = await open({
			multiple,
			directory: false,
			filters: [{
				name: filterName,
				extensions: accept.split(",").map(extension => extension.trim().replace(/^\./, ""))
			}]
		});
		if (typeof path === "string") onpath(path);
	}

	function pickFile(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		if (! input.files) return;
		if (multiple) {
			for (const file of input.files) {
				onfile(file);
			}
		} else {
			onfile(input.files[0]);
		}
		input.value = "";
	}
</script>

{#if ai?.kind === "native"}
	<button type="button" class={className} class:active disabled={disabled} onclick={pickNative}>
		{value ?? label}
	</button>
{:else}
	<label class="button {className}" class:active={active}>
		{value ?? label}
		<input type="file" {accept} hidden {disabled} onchange={pickFile} />
	</label>
{/if}

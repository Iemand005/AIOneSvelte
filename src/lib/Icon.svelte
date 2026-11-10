<script lang="ts">
	export type IconName = "settings" | "arrow";

	type Props = {
		name: IconName;
		class?: string;
		as?: keyof HTMLElementTagNameMap;
		flipped?: boolean;
	};

	let { name, flipped }: Props = $props();
</script>

<svg class:flipped={flipped} viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
	{#if name === "settings"}
	<path
		d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
		fill="none"
		stroke="currentColor"
		stroke-width="1.8"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
	<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8" />
	{/if}
	{#if name === "arrow"}
	<path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
	{/if}
</svg>


<style>
	svg {
		transition: transform 160ms ease;
	}

	svg {
		transform: none;
	}

	svg.flipped {
		transform: rotate(180deg);
	}
</style>
<script lang="ts">
	import type { Snippet } from "svelte";

	type Props = {
		children: Snippet;
		class?: string;
		as?: keyof HTMLElementTagNameMap;
	};

	let { children, class: className = "", as: tag = "div" }: Props = $props();
</script>

<svelte:element this={tag} class={`card${className ? ` ${className}` : ""}`}>
	{@render children()}
</svelte:element>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 4px;
		box-sizing: border-box;
		min-width: 0;
		padding: 14px 16px;
		border: 1px solid var(--border);
		border-radius: 12px;
		background: #5252521c;
	}
</style>

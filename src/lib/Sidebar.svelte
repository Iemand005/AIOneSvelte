<script lang="ts">
	import type { Snippet } from "svelte";
    import type { IconName } from "./Icon.svelte";
    import Icon from "./Icon.svelte";

	type Props = {
		title: string;
		side: "left" | "right";
		width?: number;
		minWidth?: number;
		maxWidth?: number;
		collapsed?: boolean;
		children: Snippet;
		views?: {
			id: string;
			title: string;
			icon?: IconName;
		}[];
		view?: string;
	};

	const COLLAPSED_WIDTH = 48;

	let {
		title,
		side,
		width = $bindable(side === "left" ? 220 : 300),
		minWidth = 180,
		maxWidth = 440,
		collapsed = $bindable(false),
		children,
		views,
		view = $bindable("chat")
	}: Props = $props();

	let resizing = $state(false);
	let startX = 0;
	let startWidth = 0;

	function startResize(event: PointerEvent) {
		resizing = true;
		startX = event.clientX;
		startWidth = collapsed ? COLLAPSED_WIDTH : width;
		event.preventDefault();
	}

	function resize(event: PointerEvent) {
		if (!resizing) return;
		const delta = (event.clientX - startX) * (side === "left" ? 1 : -1);
		const nextWidth = startWidth + delta;

		if (nextWidth <= COLLAPSED_WIDTH) {
			collapsed = true;
			return;
		}

		collapsed = false;
		width = Math.min(maxWidth, Math.max(minWidth, nextWidth));
	}

	function resizeWithKeyboard(event: KeyboardEvent) {
		if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
		event.preventDefault();
		const delta = (event.key === "ArrowRight" ? 1 : -1) * (side === "left" ? 1 : -1) * 16;
		width = Math.min(maxWidth, Math.max(minWidth, width + delta));
	}
</script>

<svelte:window onpointermove={resize} onpointerup={() => (resizing = false)} />

<aside
	class:collapsed
	class:resizing
	class:left={side === "left"}
	style:--sidebar-width={`${collapsed ? COLLAPSED_WIDTH : width}px`}
	aria-label={title}
>
	<header>
		<button
			type="button"
			class="toggle"
			aria-expanded={!collapsed}
			aria-label={`${collapsed ? "Expand" : "Collapse"} ${title}`}
			onclick={() => collapsed = !collapsed}
		>
			<Icon name="arrow" flipped={side === "left" ? !collapsed : collapsed}/>
		</button>
		{#if !collapsed}<h2>{title}</h2>{/if}
	</header>
	{#if !collapsed}<div class="content">
		{@render children()}
	</div>{/if}
	{#each views as newView}
		<button
			type="button"
			class="settings-button"
			class:active={view === newView.id}
			aria-pressed={view === newView.id}
			onclick={() => (view = view === newView.id ? "chat" : newView.id)}
		>
			{#if newView.icon}
			<Icon name={newView.icon}/>
			{/if}
			{#if !collapsed || !newView.icon}
			{newView.title}
			{/if}
		</button>
	{/each}
	<button
		type="button"
		class="resize-handle"
		aria-label={`Resize ${title}`}
		onpointerdown={startResize}
		onkeydown={resizeWithKeyboard}
	></button>
</aside>

<style>
	aside {
		position: relative;
		display: flex;
		flex: 0 0 var(--sidebar-width);
		flex-direction: column;
		min-width: 0;
		min-height: 0;
		overflow: hidden;
		padding: 16px 12px;
		padding-bottom: 0;
		box-sizing: border-box;
		background: var(--sidebar);
		border-block-start: 1px solid var(--border);
		border-inline-start: 1px solid var(--border);
		transition: flex-basis 180ms ease, padding 180ms ease;
	}

	aside.left {
		border-inline-start: 0;
		border-inline-end: 1px solid var(--border);
	}

	aside > * {
		margin-bottom: 12px;
		transition: margin 180ms ease;
	}

	aside.collapsed > * {
		margin-bottom: 0
	}

	aside.collapsed {
		padding: 0;
	}

	aside.collapsed header {
		/* height: 100%; */
		flex: 1;
	}

	aside.collapsed button {
		
		height: 48px;
		border-radius: 0;
		padding: 6px;
	}

	.toggle {
		height: 48px;
		transition: height 1s linear;
	}

	aside.collapsed .toggle {
		width: 48px;
		height: 100%;
	}

	aside.collapsed .toggle,  .resize-handle {
		height: 100% !important;
	}

	header {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 32px;
		padding: 0;
	}

	aside:not(.left) header {
		flex-direction: row-reverse;
	}

	h2 {
		flex: 1;
		margin: 0;
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.toggle {
		display: flex;
		/* place-items: center;
		 */
		align-items: flex-start;
		justify-content: center;
		flex: none;
		width: 32px;
		height: 100%;
		padding: 0;
		border-radius: 8px;
		background: transparent;
		transition: all 100ms linear;
		max-width: var(--sidebar-width);
	}

	:global(.toggle > *) {
		height: 32px;
		/* width: 32px; */
	}

	.toggle:hover {
		background-color: var(--surface-hover)	;
	}

	.content {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 12px;
		min-height: 0;
		overflow: auto;
	}

	.resize-handle {
		position: absolute;
		z-index: 1;
		inset-block: 0;
		right: 0;
		width: 8px !important;
		padding: 0;
		border: 0;
		border-radius: 0;
		background: none;
		cursor: col-resize;
		touch-action: none;
	}

	.resize-handle:hover {
		background: color-mix(in srgb, var(--text) 20%, transparent);
	}

	.left .resize-handle {
		right: 0;
	}

	aside:not(.left) .resize-handle {
		left: 0;
	}

	.resizing {
		user-select: none;
		transition: none;
	}

	button {
		padding: 8px 10px;
		font-size: 0.85rem;
		text-align: left;
		height: 48px;
	}
</style>

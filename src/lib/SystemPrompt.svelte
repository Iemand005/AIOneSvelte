<script lang="ts">
	type Props = {
		systemPrompt?: string;
	};

	let { systemPrompt = $bindable("") }: Props = $props();

	let open = $state(false);
</script>

<section class="system-prompt">
	<button type="button" class="toggle" onclick={() => (open = !open)}>
		System prompt
		{#if systemPrompt.trim()}
			<span class="indicator" aria-label="active"></span>
		{/if}
		<span class="chevron" class:open>▾</span>
	</button>

	{#if open}
		<textarea
			bind:value={systemPrompt}
			placeholder="Describe how the assistant should behave..."
			rows="4"
		></textarea>
	{/if}
</section>

<style>
	.system-prompt {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		align-self: flex-start;
		padding: 8px 14px;
		background-color: #303139;
		border-radius: 9px;
	}

	.indicator {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent-gradient);
	}

	.chevron {
		transition: transform 120ms ease-out;
	}

	.chevron.open {
		transform: rotate(180deg);
	}

	textarea {
		width: 100%;
		box-sizing: border-box;
		padding: 12px;
		background: #1b1b1b;
		border: 1px solid #303139;
		border-radius: 9px;
		color: #eee;
		font: inherit;
		resize: vertical;
	}

	textarea:focus {
		outline: none;
		border-color: rgb(139 46 38);
	}
</style>

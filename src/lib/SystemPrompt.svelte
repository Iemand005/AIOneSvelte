<script lang="ts">
	type Props = {
		systemPrompt?: string;
	};

	let { systemPrompt = $bindable("") }: Props = $props();
</script>

<div class="system-prompt">
	<textarea
		bind:value={systemPrompt}
		placeholder="Describe how the assistant should behave..."
		spellcheck="false"
	></textarea>
</div>

<style>
	.system-prompt {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	textarea {
		flex: 1;
		width: 100%;
		min-height: 0;
		box-sizing: border-box;
		padding: 12px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 9px;
		font: inherit;
		font-size: 0.9rem;
		line-height: 1.5;
		resize: none;
	}

	textarea::placeholder {
		color: var(--muted);
	}

	textarea:focus {
		outline: none;
		border-color: var(--focus);
	}
</style>

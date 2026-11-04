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
		background: #1b1b1bcc;
		border: 1px solid #303139;
		border-radius: 9px;
		color: #eee;
		font: inherit;
		font-size: 0.9rem;
		line-height: 1.5;
		resize: none;
	}

	textarea::placeholder {
		color: #7a7a7a;
	}

	textarea:focus {
		outline: none;
		border-color: rgb(139 46 38);
	}
</style>

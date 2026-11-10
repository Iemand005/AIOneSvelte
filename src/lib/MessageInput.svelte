<script lang="ts">
	type MessageInputProps = {
		sendMessage: () => void;
		generateMessage?: () => void;
		generateToken?: () => void;
		stopGeneration?: () => void;
		loading?: boolean;
		generating?: "full" | "token" | null;
		canStop?: boolean;
		prompt?: string;
	};

	let {
		sendMessage,
		generateMessage,
		generateToken,
		stopGeneration,
		loading = false,
		generating = null,
		canStop = false,
		prompt = $bindable(""),
	}: MessageInputProps = $props();

	let busy = $derived(loading || Boolean(generating));
</script>

<div class="bar">
	<div class="cover"></div>

	<form
		onsubmit={event => {
			event.preventDefault();
			if (canStop) stopGeneration?.();
			else sendMessage();
		}}
	>
		<input
			type="text"
			id="message-input"
			placeholder="Message..."
			bind:value={prompt}
			disabled={busy}
			onkeydown={event => {
				if (event.key === "Enter" && !event.shiftKey) {
					event.preventDefault();
					sendMessage();
				}
			}}
		/>
		<section>
		<button
			type="button"
			class="generate"
			title={prompt.trim() ? "Continue this message" : "Generate a message for me"}
			aria-label={prompt.trim() ? "Continue this message" : "Generate a message for me"}
			disabled={busy}
			onclick={() => generateMessage?.()}
		>
			{#if generating === "full"}
				<span class="spinner" aria-hidden="true"></span>
			{:else}
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<path
						d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z"
						fill="currentColor"
					/>
					<path
						d="M19 14l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4z"
						fill="currentColor"
					/>
				</svg>
			{/if}
		</button>
		<button
			type="button"
			class="generate"
			title="Add one token"
			aria-label="Add one token to the message"
			disabled={busy}
			onclick={() => generateToken?.()}
		>
			{#if generating === "token"}
				<span class="spinner" aria-hidden="true"></span>
			{:else}
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<path
						d="M5 12h9M10.5 8l4 4-4 4"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M19 7v10"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
			{/if}
		</button>
		</section>
		<button
			type="submit"
			class="send"
			aria-label={canStop ? "Stop generation" : "Send message"}
			title={canStop ? "Stop generation" : "Send message"}
			disabled={busy ? !canStop : !prompt.trim()}
			onclick={event => {
				if (canStop) {
					event.preventDefault();
					stopGeneration?.();
				}
			}}
		>
			{#if canStop}
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
				</svg>
			{:else}
				↵
			{/if}
		</button>
	</form>
</div>

<style>
	
	.bar {
		position: absolute;
		left: 0;
		right: 0;
		bottom: var(--bar-bottom, 0px);
		height: calc(var(--message-box-size) + var(--chatbox-pad) * 2);
		box-sizing: border-box;
		z-index: 1;
		overflow: hidden;
		pointer-events: none;
	}

	.cover,
	form {
		position: absolute;
		inset: var(--chatbox-pad);
		pointer-events: auto;
	}

	section, form {
		display: flex;
		flex-direction: row;
		gap: 5px;
	}

	/* Fills everything outside the bottom half of the pill.
	   Inset 1px more than the form so its edge hides under the border. */
	.cover {
		inset: calc(var(--chatbox-pad) + 1px);
		border-radius: 1000px;
		box-shadow: 0 0 0 100vmax var(--bg);
		clip-path: inset(50% -100vmax -100vmax -100vmax);
		pointer-events: none;
		z-index: 0;
	}

	form {
		z-index: 1;
		box-sizing: border-box;

		padding: 5px;

		border-radius: 1000px;

		background: var(--message-input-gradient);
		backdrop-filter: blur(10px);

		transition: border-color 100ms ease-out;

		overflow: hidden;
	}

	form:has(input:focus) {
		border-color: var(--focus);
	}

	input {
		flex: 1;
		width: 100%;
		margin-left: 14px;
		padding: 0;

		font-size: 17px;
		background: none;
		border: none;
		outline: none;
	}

	button {
		position: relative;
		isolation: isolate;

		height: 100%;
		aspect-ratio: 1;
		box-sizing: border-box;
		padding: 0;

		font-size: 20px;
		line-height: 35px;
		text-align: center;
		color: white;

		background: var(--accent-gradient);
		border-radius: 1000px;
		transition: color 100ms linear;
	}

	button::before {
		content: "";
		position: absolute;
		inset: 0;
		z-index: -1;
		border-radius: inherit;
		background: linear-gradient(180deg, rgb(139 46 38), rgb(119 26 20));
		opacity: 0;
		transition: opacity 120ms cubic-bezier(0, 0.73, 0.34, 0.91);
	}

	button:hover::before {
		opacity: 1;
	}

	button:active::before {
		opacity: 0;
	}

	button:active {
		background: linear-gradient(180deg, rgb(79 13 10), rgb(99 23 18));
		box-shadow: inset 0 0 10px #000000a3;
		color: #a5a5a5;
	}

	button.generate {
		display: grid;
		place-items: center;
		background: var(--surface-active);
		color: #e6e6e6;
	}

	button.generate::before {
		display: none;
	}

	button.generate:hover {
		background: #ffffff26;
		color: #fff;
	}

	button.generate:active {
		background: #ffffff0a;
		box-shadow: none;
		color: #fff;
	}

	button.generate svg {
		width: 18px;
		height: 18px;
	}

	button.send svg {
		width: 20px;
		height: 20px;
	}

	.spinner {
		width: 16px;
		height: 16px;
		box-sizing: border-box;
		border: 2px solid currentColor;
		border-right-color: transparent;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media(width: 500px) {
		section {
			display: none;
		}
	}
</style>
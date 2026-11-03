<script lang="ts">
	type MessageInputProps = {
		sendMessage: () => void;
		loading?: boolean;
		prompt?: string;
	};

	let {
		sendMessage,
		loading = false,
		prompt = $bindable(""),
	}: MessageInputProps = $props();
</script>

<div class="bar">
	<div class="cover"></div>

	<form
		onsubmit={event => {
			event.preventDefault();
			sendMessage();
		}}
	>
		<input
			type="text"
			id="message-input"
			placeholder="Message..."
			bind:value={prompt}
			disabled={loading}
			onkeydown={event => {
				if (event.key === "Enter" && !event.shiftKey) {
					event.preventDefault();
					sendMessage();
				}
			}}
		/>
		<button type="submit" disabled={loading || !prompt.trim()}>↵</button>
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
	}

	.cover,
	form {
		position: absolute;
		inset: var(--chatbox-pad);
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

		display: flex;
		padding: 5px;

		border-radius: 1000px;

		background: linear-gradient(0deg, #46454587, #36363666);
		backdrop-filter: blur(10px);

		transition: border-color 100ms ease-out;
	}

	form:has(input:focus) {
		border-color: rgb(139 46 38);
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
</style>
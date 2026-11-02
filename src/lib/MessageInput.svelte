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
<form
	class="button"
	onsubmit={event => {
		event.preventDefault();
		sendMessage();
	}}
>
    <input type="text"
        bind:value={prompt}
        placeholder="Message..."
        disabled={loading}
		id="message-input"

        onkeydown={event => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        }}
    >
    <button type="submit" disabled={loading || !prompt.trim()}>
        ↵
    </button>
</form>
</div>


<style>
	.bar {
		position: absolute;
		inset: auto 0 0 0;
		height: var(--message-box-size);
		z-index: 0;
	}

	/* Cover: same shape as the form, inset 1px so its edge hides under the border ring.
	   The shadow fills everything OUTSIDE the pill; clip-path keeps only the
	   bottom half + below, so the top corners stay see-through. */
	.bar::before {
		content: "";
		position: absolute;
		inset: 1px;
		border-radius: 1000px;
		box-shadow: 0 0 0 100vmax var(--background);
		clip-path: inset(50% -100vmax -100vmax -100vmax);
		pointer-events: none;
		z-index: 0;
	}

	form {
		position: absolute;
		inset: 0;                 /* always exactly the size of .bar */
		box-sizing: border-box;   /* so padding + border don't grow it */
		z-index: 1;

		display: flex;
		padding: 5px;

		border: 1px solid rgba(139, 46, 38, 0);
		border-radius: 1000px;

		background: #4040408f;
		backdrop-filter: blur(10px);

		transition: border-color 100ms ease-out;
	}

	form:has(input:focus) {
		border-color: rgb(139 46 38);
	}

	form, button {
		border-radius: 1000px;
	}

	input {
		flex: 1;
		width: 100%;
		background: none;
		border: none;
		outline: none;
		padding: 0;
		margin-left: 14px;

		font-size: 17px;
	}

	button {
		height: 100%;
		aspect-ratio: 1;
		box-sizing: border-box;
		line-height: 35px;
		/* margin: 6px; */
		
		font-size: 20px;
		padding: 0;
		text-align: center;
	}
	
	button {
		position: relative;
		isolation: isolate;
		color: white;
		background: var(--accent-gradient);
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
		transition: opacity 100ms linear;
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
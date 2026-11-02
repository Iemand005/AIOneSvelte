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

<div class="cover"></div>

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


<style>
	form,
	.cover {
		position: absolute;
		left: 0;
		right: 0;
		bottom: var(--bar-bottom, 0px);
		height: var(--message-box-size);
	}

	.cover {
		left: 1px;
		right: 1px;
		bottom: 1px;
		bottom: calc(var(--bar-bottom, 0px) + 1px);
		height: calc(var(--message-box-size) - 2px);

		border-radius: 1000px;
		box-shadow: 0 0 0 100vmax var(--background);
		clip-path: inset(50% -100vmax -100vmax -100vmax);
		pointer-events: none;
		z-index: 0;
	}

	form {
		box-sizing: border-box;
		z-index: 1; /* above the cover, so its border paints over the cover's edge */

		display: flex;
		padding: 5px;

		/* border: 1px solid rgba(139, 46, 38, 0); */
		border-radius: 1000px;

		background: linear-gradient(0deg, #1b1b1b, #4040408f);
		backdrop-filter: blur(10px);

		transition: border-color 100ms ease-out;
	}

	form:has(input:focus)::after {
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
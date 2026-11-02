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
	form {
		position: absolute;
		inset: auto 0 0 0;
		height: var(--message-box-size);
		box-sizing: border-box;
		z-index: 1; /* makes the form a stacking context, so the -1 children stay inside it */

		display: flex;
		padding: 6px; /* was 5px + 1px border; the border is now a pseudo-element */

		border: none;
		border-radius: 1000px;

		background: linear-gradient(0deg, var(--background), #4040408f);
		backdrop-filter: blur(10px);
	}

	/* Cover: fills everything outside the pill, bottom half only.
	   Inset 1px so its edge sits under the border ring. */
	form::before {
		content: "";
		position: absolute;
		inset: 1px;
		border-radius: 1000px;
		box-shadow: 0 0 0 100vmax var(--background);
		clip-path: inset(50% -100vmax -100vmax -100vmax);
		pointer-events: none;
		z-index: -1;
	}

	/* Border ring: later in tree order than ::before, so it paints over the cover's edge */
	form::after {
		content: "";
		position: absolute;
		inset: 0;
		border: 1px solid rgba(139, 46, 38, 0);
		border-radius: 1000px;
		pointer-events: none;
		z-index: -1;
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
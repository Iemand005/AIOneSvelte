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
		display: flex;
		padding: 0;
		border: 1px solid #404040;
	}

	form, button {
		border-radius: 1000px;
	}

	input {
		flex: 1;
		background: none;
		border: none;
		outline: none;
		padding: 0;
		margin-left: 14px;

		font-size: 17px;
	}

	button {
		width: 35px;
		height: 35px;
		line-height: 35px;
		margin: 8px;
		
		font-size: 20px;
		padding: 0;
		text-align: center;
	}
	
	button {
		color: #ffffff;
		background: linear-gradient(180deg, rgb(119 26 20), rgb(99 23 18));
		transition: background 100ms linear;
	}

	button:hover {
		background: linear-gradient(180deg, rgb(139 46 38), rgb(119 26 20));
	}

	button:active {
		background: linear-gradient(180deg, rgb(79 13 10), rgb(99 23 18));
	}
</style>
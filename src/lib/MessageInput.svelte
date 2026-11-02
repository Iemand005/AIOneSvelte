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
		transition: background 100ms linear;
		color: #ffffff;	 
		background-color: rgb(119 26 20);
		background: linear-gradient(1deg, rgb(99 23 18), rgb(119 26 20));
	}

	button:hover {
		background-color: rgb(124 38 32);
		background: linear-gradient(180deg, rgb(99 23 18), rgb(124 38 32));
	}
</style>
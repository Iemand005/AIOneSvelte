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
	}

	form, button {
		border-radius: 1000px;
	}

	input {
		flex: 1;
		background: none;
		border: none;
		outline: none;
		margin-left: 14px;
	}

	button {
		width: 35px;
		height: 35px;
		line-height: 35px;
		color: black;
		background-color: rgb(116, 0, 0);
		margin: 5px;

		font-size: 20px;
		padding: 0;
		text-align: center;
	}
</style>
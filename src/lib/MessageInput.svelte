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
        placeholder="Message AIOne..."
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
		padding: 0 14px;
	}

	form, button {
		border-radius: 1000px;
	}

	input {
		flex: 1;
		background: none;
		border: none;
		outline:none;
	}

	button {
		width: 40px;
		height: 40px;
		background-color: blue;
		margin: 5px;
	}
</style>
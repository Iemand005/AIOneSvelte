<script lang="ts">
	type MessageInputProps = {
        sendMessage: () => void;
        loading?: boolean;
        prompt?: string;
    };

    let {
        sendMessage,
        loading = false,
        prompt = $bindable("")
    }: MessageInputProps = $props();
</script>

<form onsubmit={event => {
    event.preventDefault();
    sendMessage();
}}>
    <textarea
        bind:value={prompt}
        placeholder="Message AIOne..."
        disabled={loading}
        onkeydown={event => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        }}
    ></textarea>
    <button type="submit" disabled={loading || !prompt.trim()}>
        Send
    </button>
</form>
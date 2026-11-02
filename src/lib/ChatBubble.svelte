<script lang="ts">
	import {type Message} from "./aione";
	type MessageProps = {
		message: Message;
	};
	
	let { message }: MessageProps = $props();
</script>

<article class={message.role}>
	<strong>{message.role === "user" ? "You" : "AIOne"}</strong>
	<p>{message.content}</p>
</article>

<style>
    .bubble {
        max-width: 80%;
        padding: 0.75rem 1rem;
        border-radius: 1rem;
        background: #292929;
        color: white;
        align-self: flex-start;
        overflow-wrap: anywhere;
    }

    .bubble.user {
        align-self: flex-end;
        background: #771a14;
        border-bottom-right-radius: 0.25rem;
    }

    .bubble:not(.user) {
        border-bottom-left-radius: 0.25rem;
    }

    p {
        margin: 0.4rem 0 0;
        white-space: pre-wrap;
    }
</style>
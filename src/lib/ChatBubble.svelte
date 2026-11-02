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
    article {
        max-width: 80%;
        padding: 0.75rem 1rem;
        border-radius: 1rem;
        background: #292929;
        color: white;
        align-self: flex-start;
        overflow-wrap: anywhere;
    }

    article.user {
        align-self: flex-end;
        background: var(--accent-gradient);
        border-bottom-right-radius: 0.25rem;
    }

    article:not(.user) {
        border-bottom-left-radius: 0.25rem;
    }

    p {
        margin: 0.4rem 0 0;
        white-space: pre-wrap;
    }
</style>
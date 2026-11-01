<script lang="ts">
	import {type Message} from "./aione";
	type MessageProps = {
		message: Message;
	}
	let {message}: MessageProps = $props();
</script>

<article class={message.role}>
	<strong>{message.role === "user" ? "You" : "AIOne"}</strong>
	<p>{message.content}</p>
</article>
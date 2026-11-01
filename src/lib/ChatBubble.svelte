<script lang="ts">
	import {type Message} from "./aione";
	let { message } = $props();
</script>

<article class={message.role}>
	<strong>{message.role === "user" ? "You" : "AIOne"}</strong>
	<p>{message.content}</p>
</article>
<script lang="ts">
	import {type Message as A} from "./aione";
	let { message: A } = $props();
</script>

<article class={message.role}>
	<strong>{message.role === "user" ? "You" : "AIOne"}</strong>
	<p>{message.content}</p>
</article>
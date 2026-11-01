<script>
	let { message: Message } = $props();
</script>

<article class={message.role}>
	<strong>{message.role === "user" ? "You" : "AIOne"}</strong>
	<p>{message.content}</p>
</article>
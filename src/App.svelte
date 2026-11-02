
<script lang="ts">
  import type AIOne from "aione-web";
  import { initializeAIOne, type Message } from "./lib/aione";
  import ChatBubble from './lib/ChatBubble.svelte';
  import MessageInput from "./lib/MessageInput.svelte";
  import ModelLoader from "./lib/ModelLoader.svelte";
    import ChatBox from "./lib/ChatBox.svelte";


  let ai: AIOne | null = null;

	let loading = false;
  

  initializeAIOne().then(one => ai = one);

  
</script>

<svelte:head>
  <title>AIOne Chat</title>
  <meta name="description" content="Chat with local AI models using AIOne." />
</svelte:head>

<main>
  <header>
    <h1>AIOne</h1>
    <ModelLoader {ai} bind:loading/>
  </header>

  <ChatBox {ai} bind:loading/>
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    color: #eee;
    font-family: system-ui, sans-serif;
  }

  main {
    width: min(850px, 100%);
    min-height: 100vh;
    margin: auto;
    /* padding: 32px 20px; */
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

</style>

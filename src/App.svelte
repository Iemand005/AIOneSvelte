
<script lang="ts">
  import type AIOne from "aione-web";
  import { initializeAIOne, type Message } from "./lib/aione";
  import ChatBubble from './lib/ChatBubble.svelte';
  import MessageInput from "./lib/MessageInput.svelte";
  import ModelLoader from "./lib/ModelLoader.svelte";


  let ai: AIOne | null = null;
  let prompt = "";
  let loading = false;
  let streaming = false;
  let status = "No model loaded";

  let messages: Message[] = [];

  initializeAIOne().then(one => ai = one);

  
</script>

<svelte:head>
  <title>AIOne Chat</title>
  <meta name="description" content="Chat with local AI models using AIOne." />
</svelte:head>

<main>
  <header>
    <h1>AIOne</h1>
    <ModelLoader {ai}/>
  </header>

  
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    background: #101114;
    color: #eee;
    font-family: system-ui, sans-serif;
  }

  main {
    width: min(850px, 100%);
    min-height: 100vh;
    margin: auto;
    padding: 32px 20px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  h1 {
    margin: 0;
  }

  header span {
    color: #999;
    font-size: 14px;
  }

  header span.loaded {
    color: #78d99b;
  }

  .chat {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .messages {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  article {
    max-width: 85%;
    padding: 14px 18px;
    border-radius: 12px;
    background: #24252b;
  }

  article strong {
    font-size: 13px;
    color: #aaa;
  }

  article p {
    margin: 8px 0 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    line-height: 1.5;
  }

</style>

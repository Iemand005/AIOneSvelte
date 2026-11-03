
<script lang="ts">
  import type AIOne from "aione-web";
  import { initializeAIOne, type Message } from "./lib/aione";
  import ModelLoader from "./lib/ModelLoader.svelte";
  import ChatBox from "./lib/ChatBox.svelte";
  import SystemPrompt from "./lib/SystemPrompt.svelte";


  let ai: AIOne | null = $state(null);

  let loading = $state(false);
  let systemPrompt = $state("");
  

  initializeAIOne().then(one => ai = one);
</script>

<svelte:head>
  <title>AIOne Chat</title>
  <meta name="description" content="Chat with local AI models using AIOne." />
</svelte:head>

<main>
  <header>
    <ModelLoader {ai} bind:loading/>
  </header>

  <SystemPrompt bind:systemPrompt />

  <ChatBox {ai} bind:loading bind:systemPrompt />
</main>

<style>
  main {
    width: min(850px, 100%);
    min-height: 100vh;
    margin: auto;
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

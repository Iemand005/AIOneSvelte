
<script lang="ts">
  import type AIOne from "aione-web";
  import { closeAIOne, initializeAIOne, type Message } from "./lib/aione";
  import ChatBubble from './lib/ChatBubble.svelte';
    import FileButton from "./lib/FileButton.svelte";

  let ai: AIOne | null = null;
  let prompt = "";
  let loading = false;
  let streaming = false;
  let status = "No model loaded";

  let messages: Message[] = [];

  async function loadModel(file?: File) {
    if (!file) return;

    loading = true;
    status = "Loading model...";

    try {
      ai = await initializeAIOne();
      await ai.loadModel(file);
      status = "Model loaded";
    } catch (error) {
      status = String(error);
      closeAIOne();
      ai = null;
    } finally {
      loading = false;
    }
  }

  async function sendMessage() {
    if (!ai || !prompt.trim() || loading) return;

    const content = prompt.trim();
    prompt = "";

    messages = [...messages, { role: "user", content }];

    const conversation = messages
      .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const assistantIndex = messages.length;

    loading = true;
    streaming = false;

    try {
      const response = await ai.generate(
        `${conversation}\nAssistant:`,
        512,
        token => {
          console.log("STREAM:", JSON.stringify(token));
          if (!streaming) {
            streaming = true;
            messages = [...messages, { role: "assistant", content: token }];
            return;
          }

          messages = messages.map((message, index) =>
            index === assistantIndex
              ? { ...message, content: message.content + token }
              : message
          );
        }
      );

      if (!streaming) {
        messages = [...messages, { role: "assistant", content: response }];
      } else {
        messages = messages.map((message, index) =>
          index === assistantIndex
            ? { ...message, content: response }
            : message
        );
      }
    } catch (error) {
      if (!streaming) {
        messages = [...messages, {
          role: "assistant",
          content: `Error: ${String(error)}`
        }];
      } else {
        messages = messages.map((message, index) =>
          index === assistantIndex
            ? { ...message, content: `Error: ${String(error)}` }
            : message
        );
      }
    } finally {
      loading = false;
      streaming = false;
    }
  }

  async function unloadModel() {
    await ai?.unloadModel();
    closeAIOne();
    ai = null;
    status = "No model loaded";
    messages = [];
  }
</script>

<svelte:head>
  <title>AIOne Chat</title>
  <meta name="description" content="Chat with local AI models using AIOne." />
</svelte:head>

<main>
  <header>
    <h1>AIOne</h1>
    <FileButton onselect={loadModel}/>
    <button class="unload" onclick={unloadModel}>Eject</button>
    <span class:loaded={ai}>{status}</span>
  </header>

  <section class="chat">
    <div class="messages">
      {#each messages as message}
        <ChatBubble message={message}/>
      {/each}

      {#if loading && !streaming}
        <article class="assistant">
          <strong>AIOne</strong>
          <p>Thinking...</p>
        </article>
      {/if}
    </div>

    <form onsubmit={event => { event.preventDefault(); sendMessage(); }}>
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
  </section>
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

  form {
    display: flex;
    gap: 10px;
  }

  textarea {
    flex: 1;
    min-height: 54px;
    max-height: 180px;
    resize: vertical;
    padding: 14px;
    border: 1px solid #383940;
    border-radius: 10px;
    background: #1b1c21;
    color: white;
    font: inherit;
  }

  button {
    padding: 12px 20px;
    border: 0;
    border-radius: 9px;
    background: #526de5;
    color: white;
    font: inherit;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .unload {
    align-self: flex-start;
    background: #303139;
  }
</style>

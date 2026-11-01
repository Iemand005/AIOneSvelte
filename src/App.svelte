
<script lang="ts">
  import AIOne from "aione";
  import Message from './lib/Message.svelte';

  const workerUrl = "/AIOneSvelte-dist/aio1-worker.js";

  let ai: AIOne | null = null;
  let modelFile: File | null = null;
  let prompt = "";
  let loading = false;
  let status = "No model loaded";

  let messages: Message[] = [];

  async function loadModel() {
    if (!modelFile) return;

    loading = true;
    status = "Loading model...";

    try {
      ai = await AIOne.create({ workerUrl });
      await ai.loadModel(modelFile);
      status = "Model loaded";
    } catch (error) {
      status = String(error);
      ai?.close();
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

    loading = true;

    try {
      const response = await ai.generate(
        `${conversation}\nAssistant:`,
        512
      );

      messages = [...messages, { role: "assistant", content: response }];
    } catch (error) {
      messages = [...messages, {
        role: "assistant",
        content: `Error: ${String(error)}`
      }];
    } finally {
      loading = false;
    }
  }

  function unloadModel() {
    ai?.unloadModel();
    ai?.close();
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
    <label id="model-button" for="model-input" class="button">Choose model file!</label>
    <span class:loaded={ai}>{status}</span>
  </header>

  {#if !ai}
    <section class="model-picker">
      <h2>Load a model</h2>
      <input
        type="file"
        accept=".gguf"
        name="model-input"
        id="model-input"
        style="display: none;"
        onchange={event => modelFile = event.currentTarget.files?.[0] ?? null}
      />
      <button onclick={loadModel} disabled={!modelFile || loading}>
        {loading ? "Loading..." : "Load model"}
      </button>
    </section>
  {:else}
    <section class="chat">
      <div class="messages">
        {#each messages as message}
          <Message message={message}/>
          <!-- <article class={message.role}>
            <strong>{message.role === "user" ? "You" : "AIOne"}</strong>
            <p>{message.content}</p>
          </article> -->
        {/each}

        {#if loading}
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

    <button class="unload" onclick={unloadModel}>Unload model</button>
  {/if}
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

  .model-picker {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 24px;
    border: 1px solid #303139;
    border-radius: 12px;
  }

  .chat {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .messages {
    flex: 1;
    min-height: 400px;
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

  article.user {
    align-self: flex-end;
    background: #303b55;
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

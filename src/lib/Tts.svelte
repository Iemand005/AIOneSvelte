<script lang="ts">
	import type { Backend, TtsModelSource, TtsSynthesisResult } from "./backend";

	type Props = {
		ai: Backend | null;
	};

	let { ai }: Props = $props();

	let modelFile = $state<File | null>(null);
	let mmprojFile = $state<File | null>(null);
	let nativeModelPath = $state<string | null>(null);
	let nativeMmprojPath = $state<string | null>(null);
	let loaded = $state(false);
	let loading = $state(false);
	let synthesizing = $state(false);
	let voices = $state<string[]>([]);
	let voice = $state("");
	let prompt = $state("Hello from AIOne.");
	let error = $state<string | null>(null);
	let audioUrl = $state<string | null>(null);
	let result = $state<TtsSynthesisResult | null>(null);

	const canLoad = $derived(
		ai?.kind === "native"
			? Boolean(nativeModelPath && nativeMmprojPath)
			: Boolean(modelFile && mmprojFile)
	);

	function pickModelFile(event: Event) {
		modelFile = (event.currentTarget as HTMLInputElement).files?.[0] ?? null;
	}

	function pickMmprojFile(event: Event) {
		mmprojFile = (event.currentTarget as HTMLInputElement).files?.[0] ?? null;
	}

	async function pickNativeModel() {
		const { open } = await import("@tauri-apps/plugin-dialog");
		const path = await open({
			multiple: false,
			directory: false,
			filters: [{ name: "GGUF model", extensions: ["gguf"] }]
		});
		if (typeof path === "string") nativeModelPath = path;
	}

	async function pickNativeMmproj() {
		const { open } = await import("@tauri-apps/plugin-dialog");
		const path = await open({
			multiple: false,
			directory: false,
			filters: [{ name: "GGUF mmproj", extensions: ["gguf"] }]
		});
		if (typeof path === "string") nativeMmprojPath = path;
	}

	function releaseAudio() {
		if (audioUrl) URL.revokeObjectURL(audioUrl);
		audioUrl = null;
		result = null;
	}

	async function loadTts() {
		if (!ai || !canLoad) return;

		const src: TtsModelSource = ai.kind === "native"
			? {
				kind: "path",
				modelPath: nativeModelPath as string,
				mmprojPath: nativeMmprojPath as string
			}
			: {
				kind: "file",
				modelFile: modelFile as File,
				mmprojFile: mmprojFile as File
			};

		loading = true;
		error = null;
		releaseAudio();

		try {
			await ai.ttsLoadModel(src);
			loaded = await ai.ttsIsLoaded();
			voices = loaded ? await ai.ttsVoices() : [];
			voice = voices[0] ?? "";
		} catch (cause) {
			error = String(cause);
			loaded = false;
		} finally {
			loading = false;
		}
	}

	async function unloadTts() {
		if (!ai) return;

		loading = true;
		error = null;
		releaseAudio();

		try {
			await ai.ttsUnloadModel();
		} catch (cause) {
			error = String(cause);
		} finally {
			loaded = false;
			voices = [];
			voice = "";
			loading = false;
		}
	}

	async function synthesize() {
		if (!ai || !loaded || !prompt.trim()) return;

		synthesizing = true;
		error = null;
		releaseAudio();

		try {
			const generated = await ai.ttsSynthesize(prompt, {
				outputType: "wav",
				voice: voice ? { builtInName: voice } : undefined
			});

			result = generated;
			audioUrl = URL.createObjectURL(
				new Blob([new Uint8Array(generated.audio).buffer], {
					type: generated.audioType === "wav" ? "audio/wav" : "audio/L16"
				})
			);
		} catch (cause) {
			error = String(cause);
		} finally {
			synthesizing = false;
		}
	}

	$effect(() => {
		const url = audioUrl;
		return () => {
			if (url) URL.revokeObjectURL(url);
		};
	});
</script>

<section>
	<h2>TTS</h2>

	{#if ai?.kind === "native"}
		<p>
			<button type="button" onclick={pickNativeModel}>
				{nativeModelPath ?? "Choose TTS model"}
			</button>
			<button type="button" onclick={pickNativeMmproj}>
				{nativeMmprojPath ?? "Choose mmproj"}
			</button>
		</p>
	{:else}
		<p>
			<label>
				TTS model
				<input type="file" accept=".gguf" onchange={pickModelFile} />
			</label>
		</p>
		<p>
			<label>
				mmproj
				<input type="file" accept=".gguf" onchange={pickMmprojFile} />
			</label>
		</p>
	{/if}

	<p>
		<button type="button" onclick={loadTts} disabled={!ai || !canLoad || loading}>
			{loading ? "Loading." : "Load TTS model"}
		</button>
		<button type="button" onclick={unloadTts} disabled={!loaded || loading}>
			Unload
		</button>
	</p>

	<p>Loaded: {loaded ? "yes" : "no"}</p>

	{#if voices.length > 0}
		<p>
			<label>
				Voice
				<select bind:value={voice}>
					{#each voices as name}
						<option value={name}>{name}</option>
					{/each}
				</select>
			</label>
		</p>
	{/if}

	<p>
		<textarea bind:value={prompt} rows="5" cols="60"></textarea>
	</p>

	<p>
		<button type="button" onclick={synthesize} disabled={!loaded || synthesizing || !prompt.trim()}>
			{synthesizing ? "Generating." : "Generate audio"}
		</button>
	</p>

	{#if error}
		<p>Error: {error}</p>
	{/if}

	{#if audioUrl}
		<p>
			<audio controls src={audioUrl}></audio>
		</p>
		<p>
			<a href={audioUrl} download="aione-tts.wav">Download WAV</a>
		</p>
	{/if}

	{#if result}
		<p>
			Sample rate: {result.sampleRate}, samples: {result.samples}, generation:
			{result.stats.generationMs.toFixed(0)} ms
		</p>
	{/if}
</section>

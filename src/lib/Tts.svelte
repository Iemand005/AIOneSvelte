<script lang="ts">
	import type {
		Backend,
		TtsModelSource,
		TtsProgressUpdate,
		TtsSynthesisResult
	} from "./backend";

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
	let progressMessage = $state("");
	let progressValue = $state<number | null>(null);
	let elapsedSeconds = $state(0);

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

	function handleProgress(update: TtsProgressUpdate) {
		const percent = update.progress;
		progressValue = percent;
		elapsedSeconds = Number(update.elapsedSeconds ?? elapsedSeconds);

		switch (update.stage) {
			case "initializing-runtime":
				progressMessage = `Preparing runtime; model ${(update.modelBytes! / 1e9).toFixed(2)} GB, mmproj ${(update.mmprojBytes! / 1e9).toFixed(2)} GB`;
				break;
			case "loading-model":
				progressMessage = "Starting model load";
				break;
			case "loading-backbone":
				progressMessage = `Loading TTS backbone: ${percent}%`;
				break;
			case "backbone-ready":
				progressMessage = "Backbone loaded; starting mmproj";
				break;
			case "loading-mmproj":
				progressMessage = `Loading mmproj: ${percent}%`;
				break;
			case "mmproj-ready":
				progressMessage = "mmproj loaded; finalizing model setup";
				break;
			case "loaded":
				progressMessage = "Model files loaded; checking voices";
				break;
			case "processing-prompt":
				progressMessage = "Processing prompt";
				break;
			case "synthesis":
				progressMessage = `Generating audio: ${percent} frames`;
				break;
			default:
				progressMessage = update.stage;
		}

		const isModelFileProgress =
			update.stage === "loading-backbone" ||
			update.stage === "backbone-ready" ||
			update.stage === "loading-mmproj" ||
			update.stage === "mmproj-ready";
		const shouldLog = isModelFileProgress
			? percent === null || percent === 0 || percent === 100 || percent! % 5 === 0
			: update.stage !== "synthesis" || Number(percent) % 10 === 0;
		if (shouldLog) {
			console.info("[AIOne TTS UI]", progressMessage, update);
		}
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
		progressValue = null;
		elapsedSeconds = 0;
		progressMessage = "Starting TTS load";
		releaseAudio();
		const startedAt = performance.now();
		let lastHeartbeat = 0;
		const heartbeat = window.setInterval(() => {
			elapsedSeconds = Math.floor((performance.now() - startedAt) / 1000);
			if (elapsedSeconds > 0 && elapsedSeconds % 15 === 0 && elapsedSeconds !== lastHeartbeat) {
				lastHeartbeat = elapsedSeconds;
				console.warn("[AIOne TTS UI] Still waiting for model load", {
					elapsedSeconds,
					lastProgress: progressMessage
				});
			}
		}, 1000);
		console.info("[AIOne TTS UI] Starting model load", {
			backend: ai.kind,
			model: src.kind === "file" ? { name: src.modelFile.name, bytes: src.modelFile.size } : src.modelPath,
			mmproj: src.kind === "file" ? { name: src.mmprojFile.name, bytes: src.mmprojFile.size } : src.mmprojPath
		});

		try {
			await ai.ttsLoadModel(src, {}, handleProgress);
			loaded = await ai.ttsIsLoaded();
			voices = loaded ? await ai.ttsVoices() : [];
			voice = voices[0] ?? "";
			progressMessage = loaded ? "TTS model ready" : "Load finished, but model is not ready";
			console.info("[AIOne TTS UI] Model load finished", {
				loaded,
				voices: voices.length,
				elapsedSeconds: ((performance.now() - startedAt) / 1000).toFixed(1)
			});
		} catch (cause) {
			error = String(cause);
			loaded = false;
			progressMessage = "Model load failed";
			console.error("[AIOne TTS UI] Model load failed", cause);
		} finally {
			window.clearInterval(heartbeat);
			loading = false;
		}
	}

	async function unloadTts() {
		if (!ai) return;

		loading = true;
		error = null;
		progressMessage = "Unloading TTS model";
		releaseAudio();

		try {
			await ai.ttsUnloadModel();
			progressMessage = "TTS model unloaded";
		} catch (cause) {
			error = String(cause);
			console.error("[AIOne TTS UI] Model unload failed", cause);
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
		progressMessage = "Starting audio generation";
		progressValue = null;
		releaseAudio();
		const startedAt = performance.now();
		let lastHeartbeat = 0;
		const heartbeat = window.setInterval(() => {
			elapsedSeconds = Math.floor((performance.now() - startedAt) / 1000);
			if (elapsedSeconds > 0 && elapsedSeconds % 15 === 0 && elapsedSeconds !== lastHeartbeat) {
				lastHeartbeat = elapsedSeconds;
				console.warn("[AIOne TTS UI] Synthesis still running", {
					elapsedSeconds,
					lastProgress: progressMessage
				});
			}
		}, 1000);
		console.info("[AIOne TTS UI] Starting synthesis", {
			promptLength: prompt.length,
			voice: voice || "(default)"
		});

		try {
			const generated = await ai.ttsSynthesize(prompt, {
				outputType: "wav",
				voice: voice ? { builtInName: voice } : undefined
			}, handleProgress);

			result = generated;
			audioUrl = URL.createObjectURL(
				new Blob([new Uint8Array(generated.audio).buffer], {
					type: generated.audioType === "wav" ? "audio/wav" : "audio/L16"
				})
			);
			progressMessage = "Audio generated";
			console.info("[AIOne TTS UI] Synthesis finished", {
				samples: generated.samples,
				sampleRate: generated.sampleRate,
				stats: generated.stats,
				elapsedSeconds: ((performance.now() - startedAt) / 1000).toFixed(1)
			});
		} catch (cause) {
			error = String(cause);
			progressMessage = "Audio generation failed";
			console.error("[AIOne TTS UI] Synthesis failed", cause);
		} finally {
			window.clearInterval(heartbeat);
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

	{#if progressMessage}
		<p role="status" aria-live="polite">
			{progressMessage}
			{#if loading || synthesizing}
				({elapsedSeconds}s elapsed)
			{/if}
		</p>
	{/if}
	{#if loading && progressValue !== null}
		<progress value={progressValue} max="100" aria-label={progressMessage}></progress>
	{/if}

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

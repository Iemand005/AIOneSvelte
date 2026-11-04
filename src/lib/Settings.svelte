<script lang="ts">
	import Card from "./Card.svelte";
	import { getHardwareInfo, type HardwareInfo } from "./system-info";

	type Props = {
		onback: () => void;
	};

	let { onback }: Props = $props();

	let info = $state<HardwareInfo | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function refresh() {
		loading = true;
		error = null;

		try {
			info = await getHardwareInfo();
		} catch (cause) {
			error = String(cause);
		} finally {
			loading = false;
		}
	}

	function formatBytes(value: number) {
		if (!value) return "—";

		const units = ["B", "KB", "MB", "GB", "TB"];
		let size = value;
		let unit = 0;

		while (size >= 1024 && unit < units.length - 1) {
			size /= 1024;
			unit += 1;
		}

		return `${size.toFixed(unit >= 3 ? 1 : 0)} ${units[unit]}`;
	}

	$effect(() => {
		void refresh();
	});
</script>

<section class="settings">
	<header>
		<div>
			<h1>Settings</h1>
			<p>
				Hardware detected by
				{info?.source === "llama.cpp" ? "llama.cpp" : "the browser"}.
			</p>
		</div>

		<div class="actions">
			<button type="button" onclick={refresh} disabled={loading}>
				{loading ? "Detecting…" : "Refresh"}
			</button>
			<button type="button" class="primary" onclick={onback}>Back</button>
		</div>
	</header>

	{#if error}
		<p class="status error">{error}</p>
	{:else if loading && !info}
		<p class="status">Detecting hardware…</p>
	{:else if info}
		<div class="grid">
			<Card>
				<span class="label">Backend</span>
				<strong class="value">{info.backend}</strong>
			</Card>
			<Card>
				<span class="label">Platform</span>
				<strong class="value">{info.platform || "Unknown"}</strong>
			</Card>
			<Card>
				<span class="label">CPU threads</span>
				<strong class="value">{info.cpuCores ?? "Unknown"}</strong>
			</Card>
			<Card>
				<span class="label">System memory</span>
				<strong class="value">{info.memoryGB ? `${info.memoryGB} GB` : "Unknown"}</strong>
			</Card>
		</div>

		<section class="section">
			<h2>GPU / compute devices</h2>

			{#if info.devices.length === 0}
				<p class="status">No compute devices were reported.</p>
			{:else}
				<ul class="devices">
					{#each info.devices as device}
						<Card as="li">
							<div class="device-head">
								<strong class="value">
									{device.description || device.name || "Unnamed device"}
								</strong>
								<span class={`badge ${device.type}`}>{device.type === "igpu" ? "iGPU" : device.type.toUpperCase()}</span>
							</div>

							<dl>
								<div>
									<dt>Backend name</dt>
									<dd>{device.name || "—"}</dd>
								</div>
								<div>
									<dt>Memory</dt>
									<dd>
										{formatBytes(device.memoryFree)} free of
										{formatBytes(device.memoryTotal)}
									</dd>
								</div>
								{#if device.deviceId}
									<div>
										<dt>PCI bus</dt>
										<dd>{device.deviceId}</dd>
									</div>
								{/if}
							</dl>
						</Card>
					{/each}
				</ul>
			{/if}
		</section>

		{#if info.systemInfo}
			<section class="section">
				<h2>llama.cpp system info</h2>
				<pre>{info.systemInfo}</pre>
			</section>
		{/if}
	{/if}
</section>

<style>
	.settings {
		display: flex;
		flex-direction: column;
		gap: 20px;
		height: 100%;
		min-height: 0;
		overflow-y: auto;
		padding: var(--chatbox-pad);
		box-sizing: border-box;
	}

	.cpu {
		--accent-gradient: linear-gradient(180deg, rgb(12, 90, 139), rgb(18, 60, 99));
	}

	.gpu {
		--accent-gradient: linear-gradient(180deg, rgb(37, 119, 20), rgb(31, 99, 18));
	}

	.igpu {
		--accent-gradient: linear-gradient(180deg, rgb(135, 13, 127), rgb(90, 10, 96));
	}

	header {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		padding: 0;
	}

	h1 {
		margin: 0;
		color: var(--text-h);
		font-size: 1.5rem;
		line-height: 1.2;
	}

	header p {
		margin: 4px 0 0;
		color: #7d7d7d;
		font-size: 0.9rem;
	}

	.actions {
		display: flex;
		gap: 8px;
	}

	.actions button {
		padding: 9px 14px;
		font-size: 0.85rem;
		color: var(--text);
		background: #5252521c;
	}

	.actions button:hover:not(:disabled) {
		background: #52525233;
	}

	.actions button:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.actions .primary {
		color: #fff;
		background: var(--accent-gradient);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 10px;
	}

	.label {
		color: #7d7d7d;
		font-size: 0.72rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.value {
		color: var(--text-h);
		font-size: 0.95rem;
		overflow-wrap: anywhere;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	h2 {
		margin: 0;
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text);
	}

	.devices {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.device-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.badge {
		flex: none;
		padding: 3px 8px;
		border-radius: 999px;
		background: var(--accent-gradient);
		color: #fff;
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.08em;
	}

	dl {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 8px 16px;
		margin: 6px 0 0;
	}

	dl div {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	dt {
		color: #7d7d7d;
		font-size: 0.7rem;
	}

	dd {
		margin: 0;
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	pre {
		margin: 0;
		padding: 14px 16px;
		overflow-x: auto;
		border: 1px solid var(--border);
		border-radius: 12px;
		background: var(--code-bg);
		font-family: var(--mono);
		font-size: 0.75rem;
		line-height: 1.5;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.status {
		margin: 0;
		color: #7d7d7d;
		font-size: 0.9rem;
	}

	.status.error {
		color: #ff8a7a;
	}
</style>

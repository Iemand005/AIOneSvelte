import {
	getSystemInfo,
	isNativeAIOneAvailable,
	type HardwareDevice
} from "./aione-native";

export interface HardwareInfo {
	source: "llama.cpp" | "browser";
	backend: "native" | "wasm";
	platform: string;
	cpuCores: number | null;
	memoryGB: number | null;
	devices: HardwareDevice[];
	systemInfo: string | null;
}

type NavigatorWithMemory = Navigator & { deviceMemory?: number };

function browserDevices(): HardwareDevice[] {
	try {
		const canvas = document.createElement("canvas");
		const gl = canvas.getContext("webgl") as WebGLRenderingContext | null;
		if (!gl) return [];

		const extension = gl.getExtension("WEBGL_debug_renderer_info");
		const description = extension
			? String(gl.getParameter(extension.UNMASKED_RENDERER_WEBGL))
			: "WebGL renderer";
		const vendor = extension
			? String(gl.getParameter(extension.UNMASKED_VENDOR_WEBGL))
			: "";

		return [
			{
				index: 0,
				name: vendor ? `${vendor} ${description}` : description,
				description,
				type: "gpu",
				memoryFree: 0,
				memoryTotal: 0,
				deviceId: ""
			}
		];
	} catch {
		return [];
	}
}

export async function getHardwareInfo(): Promise<HardwareInfo> {
	const platform = typeof navigator !== "undefined" ? navigator.platform : "";
	const cpuCores =
		typeof navigator !== "undefined" ? navigator.hardwareConcurrency || null : null;
	const memoryGB =
		typeof navigator !== "undefined"
			? ((navigator as NavigatorWithMemory).deviceMemory ?? null)
			: null;

	if (isNativeAIOneAvailable()) {
		const info = await getSystemInfo();

		return {
			source: "llama.cpp",
			backend: "native",
			platform,
			cpuCores,
			memoryGB,
			devices: info.devices ?? [],
			systemInfo: info.systemInfo ?? null
		};
	}

	return {
		source: "browser",
		backend: "wasm",
		platform,
		cpuCores,
		memoryGB,
		devices: browserDevices(),
		systemInfo: null
	};
}

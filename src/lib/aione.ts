import AIOne from "aione-web";

const BASE_URL = import.meta.env.BASE_URL;

export const threaded = crossOriginIsolated && typeof SharedArrayBuffer !== "undefined";

export let ai: Awaited<ReturnType<typeof AIOne.create>> | null = null;
export let usingThreads = false;

async function threadedRuntimeAvailable() {
    if (!threaded) return false;

    const files = [
        "build/Release-mt/AIOneWebMT.js",
        "build/Release-mt/AIOneWebMT.wasm"
    ];

    try {
        const checks = await Promise.all(
            files.map(file =>
                fetch(`${BASE_URL}${file}`, {
                    method: "HEAD",
                    cache: "no-store"
                }).then(response => response.ok)
            )
        );

        return checks.every(Boolean);
    } catch {
        return false;
    }
}

export async function initializeAIOne() {
    if (ai) return ai;

    usingThreads = threaded && (await threadedRuntimeAvailable());

    const workerUrl = `${BASE_URL}worker-runtime.js${usingThreads ? "?threads=1" : ""}`;

    ai = await AIOne.create({ workerUrl, threads: true });

    return ai;
}

export function closeAIOne() {
    ai?.close();
    ai = null;
    usingThreads = false;
}

export interface Message {
    role: "user" | "assistant";
    content: string;
}

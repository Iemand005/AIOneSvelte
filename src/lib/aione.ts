import AIOne from "https://iemand005.github.io/AIOneJS/web/AIOne.d.ts";

export let ai: Awaited<ReturnType<typeof AIOne.create>> | null = null;

export async function initializeAIOne() {
    if (ai) return ai;

    ai = await AIOne.create({
        workerUrl: "/aio1-worker.js"
    });

    return ai;
}
import AIOne from "https://iemand005.github.io/AIOneJS/web/AIOne.js";

export let ai: Awaited<ReturnType<typeof AIOne.create>> | null = null;

export async function initializeAIOne() {
    if (ai) return ai;

    ai = await AIOne.create({
        workerUrl: "/aio1-worker.js"
    });

    return ai;
}
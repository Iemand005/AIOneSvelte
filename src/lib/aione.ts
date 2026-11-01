import AIOne from "aione";

export let ai: Awaited<ReturnType<typeof AIOne.create>> | null = null;

export async function initializeAIOne() {
    if (ai) return ai;

    ai = await AIOne.create({
        workerUrl: "/aio1-worker.js"
    });

    return ai;
}

interface Message {
    role: "user" | "assistant";
    content: string;
}
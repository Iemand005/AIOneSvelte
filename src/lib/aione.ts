import AIOne from "aione-web";

export let ai: Awaited<ReturnType<typeof AIOne.create>> | null = null;

export async function initializeAIOne() {
    if (ai) return ai;

    ai = await AIOne.create({
        workerUrl: `${import.meta.env.BASE_URL}aio1-worker.js`
    });

    return ai;
}

export interface Message {
    role: "user" | "assistant";
    content: string;
}
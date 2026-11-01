self.AIOne_BASE_URL = "https://iemand005.github.io/AIOneJS/web/";

console.log("Bootstrap loaded");

try {
    importScripts(self.AIOne_BASE_URL + "service-worker.js");
    console.log("Remote worker script loaded");
} catch (error) {
    console.error("Remote import failed:", error);
}
self.addEventListener("securitypolicyviolation", e => {
    console.error("CSP BLOCKED:", e.violatedDirective, e.blockedURI);
});

console.log("Worker started");

importScripts(
    "https://iemand005.github.io/AIOneJS/web/AIOneWeb.js"
);

console.log("AIOneWeb loaded");

importScripts(
    "https://iemand005.github.io/AIOneJS/web/worker-runtime.js"
);
self.addEventListener("securitypolicyviolation", e => {
    console.error("CSP BLOCKED:", e.violatedDirective, e.blockedURI);
});

console.log("Worker started");

const pub = false;
const baseUrl = pub?  "https://iemand005.github.io/AIOneJS/web/" : "/AIOneSvelte-dist/";

importScripts(
    baseUrl + "AIOneWeb.js",
    baseUrl + "worker-runtime.js"
);

console.log("AIOneWeb loaded");
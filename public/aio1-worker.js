console.log("AIOne bootstrap executing");

self.onconnect = event => {
    console.log("AIOne connected");

    const port = event.ports[0];
    port.start();
    port.postMessage({ type: "ready" });
};
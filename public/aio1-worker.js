self.onconnect = event => {
    const port = event.ports[0];

    port.onmessage = ({ data }) => {
        port.postMessage({
            type: "debug",
            received: data
        });
    };

    port.start();
    port.postMessage({ type: "ready" });
};
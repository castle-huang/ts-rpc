import {HttpTransport} from "@ts-rpc/core";

async function startServer() {
    const server = new HttpTransport();
    const port = parseInt(process.env.PORT || '3000');
    await server.start(port);
}

startServer().catch(console.error);
console.log('Server started');
import dotenv from 'dotenv';

dotenv.config();

import {HttpTransport} from "@ts-rpc/core";

async function startServer() {
    const server = new HttpTransport();
    await server.start(3000);
}

// @ts-ignore
if (require.main === module) {
    startServer().catch(console.error);
    console.log('Server started');
}
import dotenv from 'dotenv';

dotenv.config();
import {HttpTransport, ServiceRegistry, ServiceProxy} from "@ts-rpc/core";

async function startServer() {
    const registry = new ServiceRegistry(new ServiceProxy({
        baseURL: 'http://localhost:3000',
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json'
        }
    }));
    await registry.autoDiscover("test")
    const server = new HttpTransport();
    await server.start(3001);
}

if (require.main === module) {
    startServer().catch(console.error);
    console.log('Server started');
}
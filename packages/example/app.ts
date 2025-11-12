import {HttpTransport} from "@ts-rpc/core";
// 显式导入所有服务，确保它们被编译
// import fs from 'fs';
// import path from 'path';
//
// async function importAllServices() {
//     const serviceDir = path.join(__dirname, 'src', 'services');
//     const files = fs.readdirSync(serviceDir);
//
//     for (const file of files) {
//         if (file.endsWith('.ts') || file.endsWith('.js')) {
//             await import(path.join(serviceDir, file));
//         }
//     }
// }

async function startServer() {
    // await importAllServices();
    const server = new HttpTransport();
    const port = parseInt(process.env.PORT || '3000');
    await server.start(port, ['src', 'packages/example/src']);
}


startServer().catch(console.error);
console.log('Server started');
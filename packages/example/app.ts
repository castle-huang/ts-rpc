
import express from 'express';
import { HttpTransport } from "@ts-rpc/core";

// 创建服务实例
const server = new HttpTransport();

// 为Vercel导出
export { server };

// 本地开发时启动服务
if (require.main === module) {
    server.start(process.env.PORT ? parseInt(process.env.PORT) : 3000)
        .catch(console.error);
    console.log('Server started');
}
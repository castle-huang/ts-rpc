import express from 'express';
import {HttpTransport} from "@ts-rpc/core";

const server = new HttpTransport();

// 导出 Vercel 需要的 handler
export default server.getApp();

// 本地开发时启动服务器
if (require.main === module) {
    server.start(process.env.PORT ? parseInt(process.env.PORT) : 3000)
        .catch(console.error);
    console.log('Server started');
}

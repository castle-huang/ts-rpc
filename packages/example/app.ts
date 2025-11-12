// import {HttpTransport} from "@ts-rpc/core";
//
// async function startServer() {
//     const server = new HttpTransport();
//     const port = parseInt(process.env.PORT || '3000');
//     await server.start(port);
// }
//
// startServer().catch(console.error);
// console.log('Server started');

// src/app.ts
import express, {Request, Response} from 'express';

const app = express();
const port = process.env.PORT || 3000;

// 中间件：解析 JSON 请求体
app.use(express.json());

// 基础路由
app.get('/biz', (req: Request, res: Response) => {
    res.json({
        message: 'Hello, TypeScript BUSINESS'
    });
});

// 健康检查端点
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({status: 'OK'});
});

// 启动服务器
app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});
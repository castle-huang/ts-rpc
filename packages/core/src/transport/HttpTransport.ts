import express, {Application, Request, Response, NextFunction} from 'express';
import {ServiceScanner} from '../scanner/ServiceScanner';
import {RpcRequest, RpcResponse} from '../types/Types';

/**
 * Interface for route information
 */
interface RouteInfo {
    method: string;
    path: string;
    name: string;
}

/**
 * HttpTransport handles HTTP server setup, routing, and RPC communication
 *
 * Features:
 * - Express.js server configuration
 * - Automatic route registration from controllers
 * - RPC endpoint handling
 * - Service discovery endpoint
 * - Parameter binding for controller methods
 */
export class HttpTransport {
    private app: Application;
    private scanner: ServiceScanner;

    constructor() {
        this.app = express();
        this.scanner = new ServiceScanner();
    }

    /**
     * Sets up middleware for the Express application
     */
    private setupMiddlewares(): void {
        this.app.use(express.json({limit: '10mb'}));
        this.app.use(express.urlencoded({extended: true}));

        // Request logging
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            console.log(`${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            next();
        });
    }

    /**
     * Sets up all routes including RPC, service discovery, and health check
     */
    private setupRoutes(): void {
        // RPC call endpoint
        this.app.post('/rpc', async (req: Request, res: Response) => {
            await this.handleRpcCall(req, res);
        });

        // Service discovery endpoint
        this.app.get('/rpc/services', (req: Request, res: Response) => {
            this.handleServiceDiscovery(req, res);
        });

        // Health check endpoint
        this.app.get('/health', (req: Request, res: Response) => {
            const cwd = process.cwd();
            const fs = require('fs');
            const path = require('path');

            // 递归获取目录下所有文件
            function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
                const files = fs.readdirSync(dirPath);

                files.forEach((file: string) => {
                    const filePath = path.join(dirPath, file);
                    if (fs.statSync(filePath).isDirectory()) {
                        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
                    } else {
                        arrayOfFiles.push(filePath);
                    }
                });

                return arrayOfFiles;
            }

            const allFiles = getAllFiles(cwd);

            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                cwd,
                files: allFiles
            });
        });

        // Build controller routes
        this.buildControllerRoutes();
    }

    /**
     * Builds routes from scanned controllers and their method metadata
     */
    private buildControllerRoutes(): void {
        const controllers = this.scanner.getControllers();

        for (const controller of controllers) {
            const controllerMetadata = Reflect.getMetadata('controller:metadata', controller.instance.constructor);
            const basePath = controllerMetadata?.basePath || '';
            const routes: RouteInfo[] = controller.methods || [];

            console.log(`Building routes for controller: ${controller.name}`);

            for (const route of routes) {
                const fullPath = this.normalizePath(basePath, route.path);
                let methodName = route.name;
                // Create parameter-bound handler function
                const handler = this.createParameterBoundHandler(controller, methodName);
                switch (route.method?.toUpperCase()) {
                    case 'GET':
                        this.app.get(fullPath, handler);
                        break;
                    case 'POST':
                        this.app.post(fullPath, handler);
                        break;
                    case 'PUT':
                        this.app.put(fullPath, handler);
                        break;
                    case 'DELETE':
                        this.app.delete(fullPath, handler);
                        break;
                    case 'PATCH':
                        this.app.patch(fullPath, handler);
                        break;
                    default:
                        console.warn(`Unsupported HTTP method: ${route.method}`);
                        continue;
                }
            }
        }
    }

    /**
     * Creates a parameter-bound handler function for controller methods
     * @param controller - Controller instance
     * @param methodName - Name of the method to handle
     * @returns Express request handler with parameter binding
     */
    private createParameterBoundHandler(controller: any, methodName: string): express.RequestHandler {
        return async (req: Request, res: Response, next: express.NextFunction) => {
            try {
                // Get method parameter metadata
                const paramMetadata = Reflect.getMetadata('controller:params', controller.instance.constructor, methodName) || [];

                // Sort parameters by index
                paramMetadata.sort((a: any, b: any) => a.index - b.index);
                // Prepare parameter values
                const args: any[] = [];
                for (const param of paramMetadata) {
                    switch (param.type) {
                        case 'request':
                            args[param.index] = req;
                            break;
                        case 'response':
                            args[param.index] = res;
                            break;
                        case 'query':
                            if (param.name) {
                                args[param.index] = req.query[param.name];
                            } else {
                                args[param.index] = req.query;
                            }
                            break;
                        case 'body':
                            args[param.index] = req.body;
                            break;
                        case 'param':
                            if (param.name) {
                                args[param.index] = req.params[param.name];
                            } else {
                                args[param.index] = req.params;
                            }
                            break;
                        case 'headers':
                            if (param.name) {
                                args[param.index] = req.headers[param.name.toLowerCase()];
                            } else {
                                args[param.index] = req.headers;
                            }
                            break;
                        case 'header':
                            if (param.name) {
                                args[param.index] = req.headers[param.name.toLowerCase()];
                            }
                            break;
                        default:
                            args[param.index] = undefined;
                    }
                }

                // Call the actual method
                const result = await controller.instance[methodName](...args);

                // If method didn't send response directly and has return value, send JSON response
                if (!res.headersSent && result !== undefined) {
                    res.json(result);
                }
            } catch (error) {
                next(error);
            }
        };
    }

    /**
     * Normalizes path segments by joining and cleaning slashes
     * @param paths - Path segments to normalize
     * @returns Normalized path string
     */
    private normalizePath(...paths: string[]): string {
        const joined = paths.join('/').replace(/\/+/g, '/');
        return joined.startsWith('/') ? joined : '/' + joined;
    }

    /**
     * Handles RPC method calls
     * @param req - Express request object
     * @param res - Express response object
     */
    private async handleRpcCall(req: Request, res: Response): Promise<void> {
        const startTime = Date.now();
        const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        try {
            const rpcRequest: RpcRequest = req.body;
            // Verify RPC call TOKEN
            const expectedToken = process.env.RPC_TOKEN;
            if (expectedToken) {
                const providedToken = req.headers['x-rpc-token'];
                if (!providedToken || providedToken !== expectedToken) {
                    throw new Error('Unauthorized access');
                }
            }

            console.log(`RPC Call: ${rpcRequest.service}.${rpcRequest.method}`, {
                requestId: rpcRequest.metadata?.requestId || requestId
            });

            // Begin request scope (commented out)
            // container.beginRequestScope(requestId);

            const service = this.scanner.getService(rpcRequest.service);
            if (!service || service.type !== 'rpc') {
                throw new Error(`RPC Service not found: ${rpcRequest.service}`);
            }

            const method = this.scanner.getMethod(rpcRequest.service, rpcRequest.method);
            if (!method) {
                throw new Error(`Method not found: ${rpcRequest.service}.${rpcRequest.method}`);
            }

            // Call the method
            const result = await service.instance[method.originalName](...rpcRequest.args);

            const response: RpcResponse = {
                success: true,
                data: result,
                metadata: {
                    requestId: rpcRequest.metadata?.requestId || requestId,
                    timestamp: Date.now(),
                    duration: Date.now() - startTime
                }
            };

            res.json(response);

        } catch (error: any) {
            const response: RpcResponse = {
                success: false,
                error: {
                    message: error.message,
                    code: 'INTERNAL_ERROR',
                    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                },
                metadata: {
                    requestId: req.body.metadata?.requestId || requestId,
                    timestamp: Date.now(),
                    duration: Date.now() - startTime
                }
            };

            res.status(500).json(response);
        } finally {
            // End request scope (commented out)
            // container.endRequestScope(requestId);
        }
    }

    /**
     * Handles service discovery requests
     * @param req - Express request object
     * @param res - Express response object
     */
    private handleServiceDiscovery(req: Request, res: Response): void {
        const services = this.scanner.getRpcServices().map(service => ({
            name: service.name,
            methods: service.methods.map(m => ({
                name: m.name,
                originalName: m.originalName
            }))
        }));

        res.json({
            success: true,
            data: {
                services,
                totalServices: services.length,
                totalMethods: services.reduce((sum, service) => sum + service.methods.length, 0),
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Starts the HTTP server
     * @param port - Port to listen on (default: 3000)
     * @param directories - Directories to scan for services (default: ['src'])
     * @returns Promise that resolves when server starts
     */
    async start(port: number = 3000, directories: string[] = ['src']): Promise<void> {
        // Scan services
        await this.scanner.scanServices(directories);
        // Setup middlewares
        this.setupMiddlewares();
        // Setup routes
        this.setupRoutes();
        this.app.listen(port, () => {
            console.log(`Port: ${port}`);
            console.log(`Service discovery: http://localhost:${port}/rpc/services`);
            console.log(`RPC endpoint: http://localhost:${port}/rpc`);
            console.log(`Health endpoint: http://localhost:${port}/health`);
        });
    }

    /**
     * Gets the Express application instance
     * @returns Express Application instance
     */
    getApp(): Application {
        return this.app;
    }
}
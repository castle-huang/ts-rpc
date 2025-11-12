import axios, {AxiosInstance} from 'axios';
import {RpcRequest, RpcResponse} from '../types/Types';

/**
 * Configuration interface for ServiceProxy
 */
export interface ServiceProxyConfig {
    baseURL: string;
    timeout?: number;
    headers?: Record<string, string>;
}

/**
 * ServiceProxy provides a mechanism to create dynamic proxies for remote services
 * and handle RPC (Remote Procedure Call) communications with a backend server.
 *
 * Features:
 * - Automatic service discovery
 * - Dynamic proxy creation for remote services
 * - Request/response interceptors for logging
 * - Authentication token management
 * - Response caching for service proxies
 */
export class ServiceProxy {
    private client: AxiosInstance;
    private serviceCache: Map<string, any> = new Map();

    /**
     * Creates a new ServiceProxy instance
     * @param config - Configuration object for the proxy
     */
    constructor(private config: ServiceProxyConfig) {
        this.client = axios.create({
            baseURL: config.baseURL,
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
                'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
                ...config.headers
            }
        });
        this.setupInterceptors();
    }

    /**
     * Sets up request and response interceptors for logging and error handling
     */
    private setupInterceptors(): void {
        this.client.interceptors.request.use(
            (config) => {
                // add rpc token
                const rpcToken = process.env.RPC_TOKEN;
                if (rpcToken) {
                    config.headers['x-rpc-token'] = rpcToken;
                }
                return config;
            },
            (error) => {
                console.error('RPC Request failed:', error);
                return Promise.reject(error);
            }
        );

        this.client.interceptors.response.use(
            (response) => {
                return response;
            },
            (error) => {
                console.error('RPC Response error:', error.response?.data || error.message);
                return Promise.reject(error);
            }
        );
    }

    /**
     * Discovers available services from the remote server
     * @returns Promise resolving to the service discovery data
     * @throws Error if service discovery fails
     */
    async discoverServices(): Promise<any> {
        try {
            const response = await this.client.get('/rpc/services');
            return response.data;
        } catch (error) {
            console.error('Failed to discover services:', error);
            throw error;
        }
    }

    /**
     * Creates a dynamic proxy for a remote service
     * @param serviceName - Name of the remote service
     * @returns A proxy object that forwards method calls to the remote service
     * @template T - The interface type of the service
     */
    createProxy<T extends object>(serviceName: string): T {
        // Return cached proxy if available
        if (this.serviceCache.has(serviceName)) {
            return this.serviceCache.get(serviceName);
        }

        // Create an empty object as the proxy target
        const target = {} as T;

        const proxy = new Proxy(target, {
            get: (target: T, methodName: string | symbol) => {
                // Skip Symbol properties
                if (typeof methodName === 'symbol') {
                    return target[methodName as keyof T];
                }

                // Skip prototype methods and special properties
                if (methodName in Object.prototype || methodName === 'then' || methodName === 'catch') {
                    return target[methodName as keyof T];
                }

                // Return a function that calls the remote method
                return async (...args: any[]): Promise<any> => {
                    return this.callRemoteMethod(serviceName, methodName, args);
                };
            }
        });

        // Cache the proxy for future use
        this.serviceCache.set(serviceName, proxy);
        return proxy;
    }

    /**
     * Calls a remote method on the specified service
     * @param serviceName - Name of the remote service
     * @param methodName - Name of the method to call
     * @param args - Arguments to pass to the method
     * @returns Promise resolving to the method result
     * @throws Error if the remote call fails
     */
    private async callRemoteMethod(serviceName: string, methodName: string, args: any[]): Promise<any> {
        const request: RpcRequest = {
            service: serviceName,
            method: methodName,
            args,
            metadata: {
                requestId: `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
                caller: 'typescript-client'
            }
        };

        try {
            const response = await this.client.post<RpcResponse>('/rpc', request);

            if (response.data.success) {
                return response.data.data;
            } else {
                throw new Error(response.data.error?.message || 'RPC call failed');
            }
        } catch (error: any) {
            if (error.response?.data) {
                const rpcError = error.response.data as RpcResponse;
                throw new Error(rpcError.error?.message || 'RPC call failed');
            }
            throw error;
        }
    }

    /**
     * Sets the authentication token for all subsequent requests
     * @param token - JWT token or other authentication token
     */
    setAuthToken(token: string): void {
        this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    /**
     * Sets custom headers for all subsequent requests
     * @param headers - Object containing header key-value pairs
     */
    setHeaders(headers: Record<string, string>): void {
        this.client.defaults.headers.common = {
            ...this.client.defaults.headers.common,
            ...headers
        };
    }
}
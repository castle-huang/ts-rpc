import {container, ServiceScope} from '../di/Container';

export interface RpcRequest {
    service: string;
    method: string;
    args: any[];
    metadata: {
        requestId: string;
        timestamp: number;
        caller?: string;
    };
}

export interface RpcResponse {
    success: boolean;
    data?: any;
    error?: {
        message: string;
        code?: string;
        stack?: string;
    };
    metadata: {
        requestId: string;
        timestamp: number;
        duration: number;
    };
}

// 存储 Controller 的元数据
export interface ControllerMetadata {
    basePath?: string;
    name?: string;
    version?: string;
    scope: ServiceScope;
}

// 存储 Service 的元数据
export interface ServiceMetadata {
    name?: string;
    version?: string;
    scope: ServiceScope;
}

// 存储 Component 的元数据
export interface ComponentMetadata {
    name?: string;
    version?: string;
    scope: ServiceScope;
}

// 存储路由方法的元数据
export interface RouteMethodMetadata {
    method: string;
    path: string;
    name?: string;
    description?: string;
}
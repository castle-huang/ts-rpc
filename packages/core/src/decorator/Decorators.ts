import 'reflect-metadata';
import {container, ServiceScope} from '../di/Container';
import {ServiceMetadata, ControllerMetadata, ComponentMetadata, RouteMethodMetadata} from '../types/Types';

/**
 * Decorator for RPC service classes
 * @param metadata - Configuration metadata for the RPC service
 * @returns Class decorator function
 */
export function RpcService(metadata?: { name?: string; version?: string; scope?: ServiceScope }): ClassDecorator {
    return (target: any) => {
        const serviceName = metadata?.name || target.name;
        const scope = metadata?.scope || 'singleton';
        // Register with custom container
        container.register(target, target, scope);
        // Add RPC-specific metadata
        Reflect.defineMetadata('rpc:service', {
            name: serviceName,
            version: metadata?.version || '1.0.0',
            class: target,
            scope: scope
        }, target);
    };
}

/**
 * Decorator for controller classes
 * @param options - Configuration options for the controller
 * @returns Class decorator function
 */
export function Controller(options?: {
    basePath?: string;
    name?: string;
    version?: string;
    scope?: ServiceScope
}): ClassDecorator {
    return (target: any) => {
        const serviceName = options?.name || target.name;
        const scope = options?.scope || 'singleton';
        container.register(target, target, scope);
        // Add Controller-specific metadata
        const controllerMetadata: ControllerMetadata = {
            basePath: options?.basePath || '',
            name: serviceName,
            version: options?.version || '1.0.0',
            scope
        };
        Reflect.defineMetadata('controller:metadata', controllerMetadata, target);
    };
}

/**
 * Decorator for service classes
 * @param options - Configuration options for the service
 * @returns Class decorator function
 */
export function Service(options?: {
    name?: string;
    version?: string;
    scope?: ServiceScope
}): ClassDecorator {
    return (target: any) => {
        const serviceName = options?.name || target.name;
        const scope = options?.scope || 'singleton';
        container.register(target, target, scope);
        // Add Service-specific metadata
        const serviceMetadata: ServiceMetadata = {
            name: serviceName,
            version: options?.version || '1.0.0',
            scope
        };
        Reflect.defineMetadata('service:metadata', serviceMetadata, target);
    };
}

/**
 * Decorator for component classes
 * @param options - Configuration options for the component
 * @returns Class decorator function
 */
export function Component(options?: {
    name?: string;
    version?: string;
    scope?: ServiceScope
}): ClassDecorator {
    return (target: any) => {
        const serviceName = options?.name || target.name;
        const scope = options?.scope || 'singleton';
        container.register(target, target, scope);
        // Add Component-specific metadata
        const componentMetadata: ComponentMetadata = {
            name: serviceName,
            version: options?.version || '1.0.0',
            scope
        };
        Reflect.defineMetadata('component:metadata', componentMetadata, target);
    };
}

/**
 * Generic HTTP method decorator for defining route handlers
 * @param method - HTTP method (GET, POST, PUT, etc.)
 * @param path - Route path
 * @returns Method decorator function
 */
export function HttpMethod(method: string, path: string): MethodDecorator {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        const routeMetadata: RouteMethodMetadata = {
            method,
            path,
            name: propertyKey.toString()
        };

        // Get or create route metadata array
        const routes = Reflect.getMetadata('controller:routes', target.constructor) || [];
        routes.push(routeMetadata);
        Reflect.defineMetadata('controller:routes', routes, target.constructor);

        return descriptor;
    };
}

/**
 * Decorator for RPC methods
 * @param metadata - Configuration metadata for the RPC method
 * @returns Method decorator function
 */
export function RpcMethod(metadata?: { name?: string; description?: string }): MethodDecorator {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        const methodName = metadata?.name || propertyKey.toString();

        const methods = Reflect.getMetadata('rpc:methods', target.constructor) || [];
        methods.push({
            name: methodName,
            originalName: propertyKey,
            description: metadata?.description,
            descriptor
        });

        Reflect.defineMetadata('rpc:methods', methods, target.constructor);
        return descriptor;
    };
}

/**
 * Dependency injection decorator for constructor parameters
 * @param token - Injection token (optional, will use parameter type if not provided)
 * @returns Parameter decorator function
 */
export function Inject(token?: any): ParameterDecorator {
    return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
        // Get constructor parameter types
        const paramTypes = Reflect.getMetadata('design:paramtypes', target) || [];

        // Ensure parameter types array has sufficient length
        while (paramTypes.length <= parameterIndex) {
            paramTypes.push(undefined);
        }

        // Determine injection token
        let injectionToken: any;
        if (token) {
            // Use explicitly specified token
            injectionToken = token;
        } else if (paramTypes[parameterIndex]) {
            // Try to get from design type
            injectionToken = paramTypes[parameterIndex];
        } else {
            // Fallback: construct token using parameter index and target class name
            console.warn(`Warning: Cannot determine injection token for ${target.name}[${parameterIndex}], using fallback`);
            injectionToken = `${target.name}_param_${parameterIndex}`;
        }

        // Save injection information
        const injections = Reflect.getMetadata('di:injections', target) || [];
        // Ensure injections array has sufficient length
        while (injections.length <= parameterIndex) {
            injections.push(undefined);
        }
        injections[parameterIndex] = injectionToken;

        Reflect.defineMetadata('di:injections', injections, target);
    };
}

/**
 * Shortcut decorator for HTTP GET method
 * @param path - Route path (optional)
 * @returns Method decorator function
 */
export function GET(path: string = ''): MethodDecorator {
    return HttpMethod('GET', path);
}

/**
 * Shortcut decorator for HTTP POST method
 * @param path - Route path (optional)
 * @returns Method decorator function
 */
export function POST(path: string = ''): MethodDecorator {
    return HttpMethod('POST', path);
}

/**
 * Shortcut decorator for HTTP PUT method
 * @param path - Route path (optional)
 * @returns Method decorator function
 */
export function PUT(path: string = ''): MethodDecorator {
    return HttpMethod('PUT', path);
}

/**
 * Shortcut decorator for HTTP DELETE method
 * @param path - Route path (optional)
 * @returns Method decorator function
 */
export function DELETE(path: string = ''): MethodDecorator {
    return HttpMethod('DELETE', path);
}

/**
 * Shortcut decorator for HTTP PATCH method
 * @param path - Route path (optional)
 * @returns Method decorator function
 */
export function PATCH(path: string = ''): MethodDecorator {
    return HttpMethod('PATCH', path);
}
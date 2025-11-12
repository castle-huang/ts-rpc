import 'reflect-metadata';

/**
 * Enumeration of HTTP parameter types for dependency injection
 */
export enum ParameterType {
    REQUEST = 'request',
    RESPONSE = 'response',
    QUERY = 'query',
    BODY = 'body',
    PARAM = 'param',
    HEADERS = 'headers',
    HEADER = 'header'
}

/**
 * Interface for HTTP parameter metadata
 */
export interface HttpParameterMetadata {
    index: number;
    type: ParameterType;
    name?: string;
    required?: boolean;
}

/**
 * Decorator for injecting the request object
 * @returns Parameter decorator function
 */
export function Req(): ParameterDecorator {
    return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
        const paramMetadata: HttpParameterMetadata = {
            index: parameterIndex,
            type: ParameterType.REQUEST
        };

        const existingParameters = Reflect.getMetadata('controller:params', target.constructor, propertyKey as string) || [];
        existingParameters.push(paramMetadata);
        Reflect.defineMetadata('controller:params', existingParameters, target.constructor, propertyKey as string);
    };
}

/**
 * Decorator for injecting the response object
 * @returns Parameter decorator function
 */
export function Res(): ParameterDecorator {
    return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
        const paramMetadata: HttpParameterMetadata = {
            index: parameterIndex,
            type: ParameterType.RESPONSE
        };

        const existingParameters = Reflect.getMetadata('controller:params', target.constructor, propertyKey as string) || [];
        existingParameters.push(paramMetadata);
        Reflect.defineMetadata('controller:params', existingParameters, target.constructor, propertyKey as string);
    };
}

/**
 * Decorator for injecting query parameters
 * @param name - Name of the query parameter (optional, uses parameter name if not provided)
 * @param required - Whether the parameter is required (default: false)
 * @returns Parameter decorator function
 */
export function Query(name?: string, required: boolean = false): ParameterDecorator {
    return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
        const paramMetadata: HttpParameterMetadata = {
            index: parameterIndex,
            type: ParameterType.QUERY,
            name,
            required
        };

        const existingParameters = Reflect.getMetadata('controller:params', target.constructor, propertyKey as string) || [];
        existingParameters.push(paramMetadata);
        Reflect.defineMetadata('controller:params', existingParameters, target.constructor, propertyKey as string);
    };
}

/**
 * Decorator for injecting the request body
 * @returns Parameter decorator function
 */
export function Body(): ParameterDecorator {
    return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
        const paramMetadata: HttpParameterMetadata = {
            index: parameterIndex,
            type: ParameterType.BODY
        };

        const existingParameters = Reflect.getMetadata('controller:params', target.constructor, propertyKey as string) || [];
        existingParameters.push(paramMetadata);
        Reflect.defineMetadata('controller:params', existingParameters, target.constructor, propertyKey as string);
    };
}

/**
 * Decorator for injecting route parameters
 * @param name - Name of the route parameter (optional, uses parameter name if not provided)
 * @param required - Whether the parameter is required (default: true)
 * @returns Parameter decorator function
 */
export function Param(name?: string, required: boolean = true): ParameterDecorator {
    return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
        const paramMetadata: HttpParameterMetadata = {
            index: parameterIndex,
            type: ParameterType.PARAM,
            name,
            required
        };

        const existingParameters = Reflect.getMetadata('controller:params', target.constructor, propertyKey as string) || [];
        existingParameters.push(paramMetadata);
        Reflect.defineMetadata('controller:params', existingParameters, target.constructor, propertyKey as string);
    };
}

/**
 * Decorator for injecting all request headers
 * @param name - Specific header name to extract (optional, injects all headers if not provided)
 * @returns Parameter decorator function
 */
export function Headers(name?: string): ParameterDecorator {
    return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
        const paramMetadata: HttpParameterMetadata = {
            index: parameterIndex,
            type: ParameterType.HEADERS,
            name
        };

        const existingParameters = Reflect.getMetadata('controller:params', target.constructor, propertyKey as string) || [];
        existingParameters.push(paramMetadata);
        Reflect.defineMetadata('controller:params', existingParameters, target.constructor, propertyKey as string);
    };
}

/**
 * Decorator for injecting a specific request header
 * @param name - Name of the header to inject
 * @returns Parameter decorator function
 */
export function Header(name: string): ParameterDecorator {
    return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
        const paramMetadata: HttpParameterMetadata = {
            index: parameterIndex,
            type: ParameterType.HEADER,
            name
        };

        const existingParameters = Reflect.getMetadata('controller:params', target.constructor, propertyKey as string) || [];
        existingParameters.push(paramMetadata);
        Reflect.defineMetadata('controller:params', existingParameters, target.constructor, propertyKey as string);
    };
}
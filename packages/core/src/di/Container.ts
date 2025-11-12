import 'reflect-metadata';

/**
 * Service scope types for dependency injection
 */
export type ServiceScope = 'singleton' | 'transient' | 'request';

/**
 * Interface for service registration information
 */
export interface ServiceRegistration<T = any> {
    token: any;
    implementation: new (...args: any[]) => T;
    scope: ServiceScope;
    dependencies?: any[];
}

/**
 * Custom Dependency Injection Container
 *
 * Features:
 * - Singleton, transient, and request-scoped service management
 * - Constructor parameter dependency resolution
 * - Request-scoped instance lifecycle management
 * - Service registration and instance caching
 */
export class DIContainer {
    private services: Map<any, ServiceRegistration> = new Map();
    private instances: Map<any, any> = new Map();
    private requestScopes: Map<string, Map<any, any>> = new Map();

    /**
     * Registers a service with the container
     * @param token - Service token (class or symbol)
     * @param implementation - Service implementation class
     * @param scope - Service scope (default: 'singleton')
     */
    register<T>(token: any, implementation: new (...args: any[]) => T, scope: ServiceScope = 'singleton'): void {
        // Get constructor parameter types
        const paramTypes = Reflect.getMetadata('design:paramtypes', implementation) || [];
        this.services.set(token, {
            token,
            implementation,
            scope,
            dependencies: paramTypes
        });
    }

    /**
     * Registers a pre-created service instance
     * @param token - Service token
     * @param instance - Service instance
     */
    registerInstance<T>(token: any, instance: T): void {
        this.instances.set(token, instance);
    }

    /**
     * Resolves a service instance from the container
     * @param token - Service token to resolve
     * @param requestId - Optional request ID for request-scoped services
     * @returns Resolved service instance
     * @throws Error if service is not registered
     */
    resolve<T>(token: any, requestId?: string): T {
        // 1. Check instance cache
        if (this.instances.has(token)) {
            return this.instances.get(token) as T;
        }

        // 2. Check request scope
        if (requestId && this.requestScopes.has(requestId)) {
            const requestInstances = this.requestScopes.get(requestId)!;
            if (requestInstances.has(token)) {
                const instance = requestInstances.get(token) as T;
                console.log(`Returning request-scoped instance: ${token.name || token.toString()}`);
                return instance;
            }
        }

        // 3. Resolve using custom container
        const registration = this.services.get(token);
        if (!registration) {
            throw new Error(`Service not registered: ${token.name || token.toString()}. Available services: ${Array.from(this.services.keys()).map(k => k.name || k.toString()).join(', ')}`);
        }
        const instance = this.createInstance(registration, requestId);

        // Cache instance based on scope
        switch (registration.scope) {
            case 'singleton':
                this.instances.set(token, instance);
                break;
            case 'request':
                if (requestId) {
                    if (!this.requestScopes.has(requestId)) {
                        this.requestScopes.set(requestId, new Map());
                    }
                    this.requestScopes.get(requestId)!.set(token, instance);
                }
                break;
            // transient services are not cached
        }

        return instance as T;
    }

    /**
     * Creates a new service instance with dependency resolution
     * @param registration - Service registration information
     * @param requestId - Optional request ID for dependency resolution
     * @returns New service instance
     * @throws Error if dependencies cannot be resolved
     */
    private createInstance<T>(registration: ServiceRegistration<T>, requestId?: string): T {
        // Get injection tokens information
        const injections = Reflect.getMetadata('di:injections', registration.implementation) || [];
        const dependencies = (registration.dependencies || []).map((dep, index) => {
            // Prefer injected token, fall back to design-time type
            const token = injections[index] !== undefined ? injections[index] : dep;
            if (!token) {
                const className = registration.implementation.name;
                throw new Error(`Cannot resolve dependency ${index} for ${className}. Make sure all dependencies are decorated with @Inject()`);
            }
            const resolved = this.resolve(token, requestId);
            return resolved;
        });
        return new registration.implementation(...dependencies);
    }

    /**
     * Begins a new request scope for request-scoped services
     * @param requestId - Unique request identifier
     */
    beginRequestScope(requestId: string): void {
        this.requestScopes.set(requestId, new Map());
    }

    /**
     * Ends a request scope and cleans up request-scoped instances
     * @param requestId - Request identifier to end
     */
    endRequestScope(requestId: string): void {
        this.requestScopes.delete(requestId);
    }

    /**
     * Gets all registered service names
     * @returns Array of registered service names
     */
    getRegisteredServices(): string[] {
        return Array.from(this.services.keys()).map(key =>
            key.name || key.toString()
        );
    }

    /**
     * Checks if a service is registered
     * @param token - Service token to check
     * @returns True if service is registered
     */
    has(token: any): boolean {
        return this.services.has(token);
    }

    /**
     * Resets the container, clearing all registrations and instances
     */
    reset(): void {
        this.services.clear();
        this.instances.clear();
        this.requestScopes.clear();
    }

    /**
     * Removes a specific service registration
     * @param token - Service token to remove
     */
    remove(token: any): void {
        this.services.delete(token);
        this.instances.delete(token);
    }
}

// Create default container instance
export const container = new DIContainer();
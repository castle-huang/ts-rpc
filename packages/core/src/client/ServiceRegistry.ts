import {ServiceProxy} from './ServiceProxy';
import {container} from '../di/Container';

/**
 * Definition interface for a remote service
 */
export interface ServiceDefinition {
    name: string;
    methods: string[];
}

/**
 * ServiceRegistry manages the registration and discovery of remote services
 *
 * This class provides:
 * - Automatic service discovery from remote endpoints
 * - Service proxy registration and management
 * - Dependency injection container integration
 * - Service definition tracking and retrieval
 */
export class ServiceRegistry {
    private proxies: Map<string, any> = new Map();
    private serviceDefinitions: Map<string, ServiceDefinition> = new Map();

    /**
     * Creates a new ServiceRegistry instance
     * @param proxy - ServiceProxy instance for remote communication
     */
    constructor(private proxy: ServiceProxy) {
    }

    /**
     * Automatically discovers and registers all available services from the remote server
     * @param namespace - Namespace to use for service registration
     * @returns Promise that resolves when discovery is complete
     */
    async autoDiscover(namespace: string): Promise<void> {
        try {
            console.log('Discovering remote services...');
            const discovery = await this.proxy.discoverServices();
            if (discovery.success) {
                discovery.data.services.forEach((service: any) => {
                    this.registerService(namespace, service.name, service.methods);
                });
                console.log(`Discovered ${discovery.data.totalServices} services with ${discovery.data.totalMethods} methods`);
            }
        } catch (error) {
            console.error('Service discovery failed:', error);
        }
    }

    /**
     * Registers a service proxy in the registry and dependency injection container
     * @param namespace - Namespace for the service
     * @param serviceName - Name of the service to register
     * @param methods - Array of method names available on the service
     * @returns The created service proxy instance
     * @template T - The interface type of the service
     */
    registerService<T extends object>(namespace: string, serviceName: string, methods: string[]): T {
        const proxy = this.proxy.createProxy<T>(serviceName);
        this.proxies.set(serviceName, proxy);
        this.serviceDefinitions.set(serviceName, {name: serviceName, methods});
        let serviceToken = ServiceRegistry.getServiceToken(namespace, serviceName);
        container.registerInstance(serviceToken, proxy);
        return proxy;
    }

    /**
     * Generates a unique service token for dependency injection
     * @param namespace - Namespace for the service
     * @param serviceName - Name of the service
     * @returns Unique service token string
     */
    static getServiceToken(namespace: string, serviceName: string): string {
        return `client_${namespace}_${serviceName}`;
    }

    /**
     * Retrieves a registered service proxy by name
     * @param serviceName - Name of the service to retrieve
     * @returns The service proxy instance
     * @throws Error if the service is not found
     * @template T - The interface type of the service
     */
    getService<T extends object>(serviceName: string): T {
        const proxy = this.proxies.get(serviceName);
        if (!proxy) {
            throw new Error(`Service not found: ${serviceName}`);
        }
        return proxy;
    }

    /**
     * Retrieves the service definition for a registered service
     * @param serviceName - Name of the service
     * @returns Service definition or undefined if not found
     */
    getServiceDefinition(serviceName: string): ServiceDefinition | undefined {
        return this.serviceDefinitions.get(serviceName);
    }

    /**
     * Retrieves all registered service definitions
     * @returns Array of all service definitions
     */
    getAllServices(): ServiceDefinition[] {
        return Array.from(this.serviceDefinitions.values());
    }
}
import {RpcService, RpcMethod} from '@ts-rpc/core';

@RpcService({name: 'logger-service'})
export class LoggerService {
    @RpcMethod()
    log(message: string, service: string = 'unknown'): void {
        const timestamp = new Date().toISOString();
        console.log(`[${service}] ${timestamp}: ${message}`);
    }

    @RpcMethod()
    info(message: string, service: string = 'unknown'): void {
        this.log(`INFO: ${message}`, service);
    }

    @RpcMethod()
    error(message: string, service: string = 'unknown'): void {
        this.log(`ERROR: ${message}`, service);
    }

    @RpcMethod()
    debug(message: string, service: string = 'unknown'): void {
        this.log(`DEBUG: ${message}`, service);
    }

    @RpcMethod()
    setServiceName(name: string): void {
        console.log(`Logger service name set to: ${name}`);
    }
}
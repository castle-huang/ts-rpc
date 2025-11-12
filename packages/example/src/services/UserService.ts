import {RpcService, RpcMethod, Inject, GET, POST, PUT, DELETE} from '@ts-rpc/core';
import {LoggerService} from './LoggerService';
import {UserRepository} from './UserRepository';

export interface User {
    id: number;
    name: string;
    email: string;
    age?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateUserRequest {
    name: string;
    email: string;
    age?: number;
}

export interface UpdateUserRequest {
    name?: string;
    email?: string;
    age?: number;
}

export interface IUserService {
    getUsers(query: any): Promise<{ users: User[]; total: number; page: number; pageSize: number }>;
}

// 用户服务（使用依赖注入）
@RpcService({name: 'user-service', version: '1.0.0'})
export class UserService {
    constructor(
        @Inject(UserRepository) private userRepository: UserRepository,
        @Inject(LoggerService) private logger: LoggerService
    ) {
        console.log('UserService constructor called');
        // 安全检查
        if (!this.logger) {
            throw new Error('LoggerService dependency not injected!');
        }
        if (!this.userRepository) {
            throw new Error('UserRepository dependency not injected!');
        }
        this.logger.info('UserService 初始化完成', 'user-service');
    }

    @RpcMethod()
    async users(query: any) {
        return {
            users: "user111==>" + query
        }
    }

    @RpcMethod()
    async getUsers(query: any) {
        this.logger.debug('获取用户列表', 'user-service');

        const users = await this.userRepository.findAll();

        let filteredUsers = users;

        if (query.name) {
            filteredUsers = filteredUsers.filter(user =>
                user.name.includes(query.name as string)
            );
        }

        if (query.email) {
            filteredUsers = filteredUsers.filter(user =>
                user.email.includes(query.email as string)
            );
        }

        return {
            users: filteredUsers,
            total: filteredUsers.length,
            page: query.page ? parseInt(query.page as string) : 1,
            pageSize: query.pageSize ? parseInt(query.pageSize as string) : 10
        };
    }
}
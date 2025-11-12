import {RpcService, RpcMethod, Inject} from '@ts-rpc/core';
import {LoggerService} from './LoggerService';
import {User, CreateUserRequest, UpdateUserRequest} from './UserService';

@RpcService({name: 'user-repository'})
export class UserRepository {
    private users: User[] = [
        {
            id: 1,
            name: '张三',
            email: 'zhangsan@example.com',
            age: 25,
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-01')
        },
        {
            id: 2,
            name: '李四',
            email: 'lisi@example.com',
            age: 30,
            createdAt: new Date('2023-01-02'),
            updatedAt: new Date('2023-01-02')
        }
    ];

    private nextId = 3;

    constructor(@Inject(LoggerService) private logger: LoggerService) {
        console.log('UserRepository constructor called');
        if (!this.logger) {
            throw new Error('LoggerService dependency not injected!');
        }
        this.logger.info('UserRepository 初始化完成', 'user-repository');
    }

    @RpcMethod()
    async findAll(): Promise<User[]> {
        this.logger.debug('获取所有用户', 'user-repository');
        return [...this.users];
    }

    @RpcMethod()
    async findById(id: number): Promise<User | null> {
        this.logger.debug(`根据ID查找用户: ${id}`, 'user-repository');
        return this.users.find(u => u.id === id) || null;
    }

    @RpcMethod()
    async create(userData: CreateUserRequest): Promise<User> {
        this.logger.debug('创建用户', 'user-repository');
        const newUser: User = {
            id: this.nextId++,
            ...userData,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.users.push(newUser);
        return newUser;
    }

    @RpcMethod()
    async update(id: number, userData: UpdateUserRequest): Promise<User> {
        this.logger.debug(`更新用户: ${id}`, 'user-repository');
        const index = this.users.findIndex(u => u.id === id);
        if (index === -1) {
            throw new Error(`用户不存在: ${id}`);
        }

        const updatedUser = {
            ...this.users[index],
            ...userData,
            id, // 防止ID被修改
            updatedAt: new Date()
        };

        this.users[index] = updatedUser;
        return updatedUser;
    }

    @RpcMethod()
    async delete(id: number): Promise<boolean> {
        this.logger.debug(`删除用户: ${id}`, 'user-repository');
        const index = this.users.findIndex(u => u.id === id);
        if (index === -1) {
            return false;
        }
        this.users.splice(index, 1);
        return true;
    }

    @RpcMethod()
    async search(keyword: string): Promise<User[]> {
        this.logger.debug(`搜索用户: ${keyword}`, 'user-repository');
        const lowerKeyword = keyword.toLowerCase();
        return this.users.filter(user =>
            user.name.toLowerCase().includes(lowerKeyword) ||
            user.email.toLowerCase().includes(lowerKeyword)
        );
    }
}
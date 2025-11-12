import {Controller, GET, POST, Req, Res, Query, Body, Param, Inject, ServiceRegistry} from '@ts-rpc/core';
import {Request, Response} from 'express';
import {PayService} from "../service/PayService";
import {OrderComponent} from "../component/OrderComponent";

export interface User {
    id: number;
    name: string;
    email: string;
    age?: number;
    createdAt: Date;
    updatedAt: Date;
}

export abstract class IUserService {
    abstract getUsers(query: any): Promise<{ users: User[]; total: number; page: number; pageSize: number }>;

    abstract users(query: any): Promise<{ user: string }>;
}

@Controller({basePath: '/api/test'})
export class TestController {
    constructor(@Inject(ServiceRegistry.getServiceToken("test", "user-service")) private userService: IUserService,
                @Inject() private payService: PayService,
                @Inject() private orderComponent: OrderComponent) {
        console.log('UserRepository constructor called');
        console.log(payService.demo())
        console.log(orderComponent.order())
    }

    @GET('/')
    async getHello(@Query('name') name: string) {
        const users = await this.userService.users("xxxx")
        const pay = this.payService.demo()
        const order = this.orderComponent.order()
        return {
            message: `Hello, ${name || 'World'}!`,
            timestamp: new Date().toISOString(),
            users,
            pay,
            order
        };
    }

    @GET('/user/:id')
    async getUserById(@Param('id') id: number): Promise<any> {
        return {
            id: id,
            name: `User ${id}`,
            email: `user${id}@example.com`
        };
    }

    @POST('/user')
    async createUser(@Body() userData: any) {
        return {
            id: Math.floor(Math.random() * 1000),
            ...userData,
            createdAt: new Date().toISOString()
        };
    }

    @GET('/info')
    async getRequestInfo(@Req() req: Request, @Res() res: Response) {
        res.json({
            method: req.method,
            url: req.url,
            headers: req.headers,
            timestamp: new Date().toISOString()
        });
    }
}

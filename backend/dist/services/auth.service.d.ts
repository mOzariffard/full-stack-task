import type { RegisterInput, LoginInput } from '../validators';
export declare const AuthService: {
    register(input: RegisterInput): Promise<{
        user: {
            email: string;
            name: string;
            createdAt: Date;
            id: string;
        };
        token: string;
    }>;
    login(input: LoginInput): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
        };
        token: string;
    }>;
    getProfile(userId: string): Promise<{
        email: string;
        name: string;
        createdAt: Date;
        id: string;
        _count: {
            reservations: number;
            orders: number;
        };
    }>;
};
//# sourceMappingURL=auth.service.d.ts.map
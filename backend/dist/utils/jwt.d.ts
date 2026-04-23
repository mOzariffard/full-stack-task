export interface JwtPayload {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}
export declare function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string;
export declare function verifyToken(token: string): JwtPayload;
//# sourceMappingURL=jwt.d.ts.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const SALT_ROUNDS = 12;
exports.AuthService = {
    async register(input) {
        const existing = await database_1.prisma.user.findUnique({
            where: { email: input.email },
        });
        if (existing) {
            throw new errors_1.ConflictError('Email already in use');
        }
        const password = await bcryptjs_1.default.hash(input.password, SALT_ROUNDS);
        const user = await database_1.prisma.user.create({
            data: { email: input.email, password, name: input.name },
            select: { id: true, email: true, name: true, createdAt: true },
        });
        logger_1.logger.info({ userId: user.id, email: user.email }, 'User registered');
        const token = (0, jwt_1.signToken)({ userId: user.id, email: user.email });
        return { user, token };
    },
    async login(input) {
        const user = await database_1.prisma.user.findUnique({
            where: { email: input.email },
        });
        if (!user) {
            // Use constant-time comparison to prevent timing attacks
            await bcryptjs_1.default.compare(input.password, '$2b$12$invalidhashplaceholderXXXXXXXXX');
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        const valid = await bcryptjs_1.default.compare(input.password, user.password);
        if (!valid) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        logger_1.logger.info({ userId: user.id }, 'User logged in');
        const token = (0, jwt_1.signToken)({ userId: user.id, email: user.email });
        return {
            user: { id: user.id, email: user.email, name: user.name },
            token,
        };
    },
    async getProfile(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                _count: { select: { reservations: true, orders: true } },
            },
        });
        if (!user)
            throw new errors_1.UnauthorizedError('User not found');
        return user;
    },
};
//# sourceMappingURL=auth.service.js.map
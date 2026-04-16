import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { signToken } from '../utils/jwt';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';
import type { RegisterInput, LoginInput } from '../validators';

const SALT_ROUNDS = 12;

export const AuthService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictError('Email already in use');
    }

    const password = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: { email: input.email, password, name: input.name },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    logger.info({ userId: user.id, email: user.email }, 'User registered');

    const token = signToken({ userId: user.id, email: user.email });

    return { user, token };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      // Use constant-time comparison to prevent timing attacks
      await bcrypt.compare(input.password, '$2b$12$invalidhashplaceholderXXXXXXXXX');
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    logger.info({ userId: user.id }, 'User logged in');

    const token = signToken({ userId: user.id, email: user.email });

    return {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    };
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: { select: { reservations: true, orders: true } },
      },
    });

    if (!user) throw new UnauthorizedError('User not found');
    return user;
  },
};

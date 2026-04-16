import { api } from './client';
import type { AuthTokens, User, LoginPayload, RegisterPayload } from '../types';

export const authApi = {
  register(payload: RegisterPayload): Promise<AuthTokens> {
    return api.post<AuthTokens>('/auth/register', payload, { skipAuth: true });
  },

  login(payload: LoginPayload): Promise<AuthTokens> {
    return api.post<AuthTokens>('/auth/login', payload, { skipAuth: true });
  },

  profile(): Promise<User> {
    return api.get<User>('/auth/profile');
  },
};

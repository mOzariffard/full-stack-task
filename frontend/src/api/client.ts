import type { ApiResponse } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';
const DEFAULT_TIMEOUT_MS = 10_000;

// ── Token storage ─────────────────────────────────────────────────────────────

const TOKEN_KEY = 'drop_system_token';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
};

// ── Custom API error ──────────────────────────────────────────────────────────

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

interface RequestOptions extends RequestInit {
  timeout?: number;
  skipAuth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT_MS, skipAuth = false, ...fetchOptions } = options;

  // Abort controller for timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = tokenStorage.get();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timer);

    const json: ApiResponse<T> = await response.json();

    if (!response.ok || !json.success) {
      throw new ApiError(
        json.error?.message ?? `HTTP ${response.status}`,
        response.status,
        json.error?.code ?? 'UNKNOWN_ERROR'
      );
    }

    return json.data as T;
  } catch (err) {
    clearTimeout(timer);

    if (err instanceof ApiError) throw err;

    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Request timed out', 408, 'TIMEOUT');
    }

    if (err instanceof TypeError) {
      throw new ApiError('Network error — check your connection', 0, 'NETWORK_ERROR');
    }

    throw err;
  }
}

// ── Convenience methods ───────────────────────────────────────────────────────

export const api = {
  get<T>(path: string, options?: RequestOptions) {
    return request<T>(path, { method: 'GET', ...options });
  },
  post<T>(path: string, body: unknown, options?: RequestOptions) {
    return request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    });
  },
  delete<T>(path: string, options?: RequestOptions) {
    return request<T>(path, { method: 'DELETE', ...options });
  },
};

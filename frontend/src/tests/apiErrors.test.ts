import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, ApiError, tokenStorage } from '../api/client';

// ── Mock fetch ────────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function mockResponse(body: unknown, status = 200, ok = true) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

function mockNetworkError() {
  return Promise.reject(new TypeError('Failed to fetch'));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    tokenStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Success cases ──────────────────────────────────────────────────────────

  it('returns data on successful response', async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse({ success: true, data: { id: '123', name: 'Test Product' } })
    );

    const result = await api.get<{ id: string; name: string }>('/products/123');

    expect(result).toEqual({ id: '123', name: 'Test Product' });
  });

  it('sends Authorization header when token is stored', async () => {
    tokenStorage.set('my-jwt-token');
    mockFetch.mockReturnValueOnce(mockResponse({ success: true, data: {} }));

    await api.get('/products');

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer my-jwt-token');
  });

  it('omits Authorization header when skipAuth is true', async () => {
    tokenStorage.set('my-jwt-token');
    mockFetch.mockReturnValueOnce(mockResponse({ success: true, data: {} }));

    await api.get('/public-route', { skipAuth: true });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });

  it('omits Authorization header when no token is stored', async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ success: true, data: {} }));

    await api.get('/products');

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });

  it('sends correct Content-Type for POST requests', async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ success: true, data: {} }));

    await api.post('/reserve', { productId: 'p1', quantity: 1 });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(options.method).toBe('POST');
    expect(options.body).toBe(JSON.stringify({ productId: 'p1', quantity: 1 }));
  });

  // ── Error cases ────────────────────────────────────────────────────────────

  it('throws ApiError with correct code on 4xx response', async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse(
        { success: false, error: { code: 'INSUFFICIENT_STOCK', message: 'No stock left' } },
        409,
        false
      )
    );

    await expect(api.post('/reserve', {})).rejects.toMatchObject({
      status: 409,
      code: 'INSUFFICIENT_STOCK',
      message: 'No stock left',
    });
  });

  it('throws ApiError with UNAUTHORIZED code on 401', async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Token expired' } },
        401,
        false
      )
    );

    let err: ApiError | null = null;
    try {
      await api.get('/auth/profile');
    } catch (e) {
      err = e as ApiError;
    }

    expect(err).toBeInstanceOf(ApiError);
    expect(err?.status).toBe(401);
    expect(err?.code).toBe('UNAUTHORIZED');
  });

  it('throws ApiError with NETWORK_ERROR code on fetch failure', async () => {
    mockFetch.mockImplementationOnce(() => mockNetworkError());

    await expect(api.get('/products')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      status: 0,
    });
  });

  it('throws ApiError with TIMEOUT code when request is aborted', async () => {
    mockFetch.mockImplementationOnce(() => {
      const err = new DOMException('The user aborted a request.', 'AbortError');
      return Promise.reject(err);
    });

    await expect(api.get('/products', { timeout: 1 })).rejects.toMatchObject({
      code: 'TIMEOUT',
      status: 408,
    });
  });

  it('throws ApiError when success is false even on HTTP 200', async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse(
        { success: false, error: { code: 'DUPLICATE_RESERVATION', message: 'Already reserved' } },
        200,
        true
      )
    );

    await expect(api.post('/reserve', {})).rejects.toMatchObject({
      code: 'DUPLICATE_RESERVATION',
    });
  });

  it('throws with unknown error code when error field is missing', async () => {
    mockFetch.mockReturnValueOnce(
      mockResponse({ success: false }, 500, false)
    );

    await expect(api.get('/broken')).rejects.toMatchObject({
      code: 'UNKNOWN_ERROR',
      status: 500,
    });
  });

  // ── DELETE method ──────────────────────────────────────────────────────────

  it('sends DELETE request with correct method', async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ success: true, data: { message: 'Cancelled' } }));

    await api.delete('/reservations/res-123');

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe('DELETE');
    expect(url).toContain('/reservations/res-123');
  });
});

// ── tokenStorage ──────────────────────────────────────────────────────────────

describe('tokenStorage', () => {
  afterEach(() => tokenStorage.clear());

  it('stores and retrieves a token', () => {
    tokenStorage.set('abc.def.ghi');
    expect(tokenStorage.get()).toBe('abc.def.ghi');
  });

  it('returns null when no token is stored', () => {
    expect(tokenStorage.get()).toBeNull();
  });

  it('clears the stored token', () => {
    tokenStorage.set('tok');
    tokenStorage.clear();
    expect(tokenStorage.get()).toBeNull();
  });

  it('overwrites previous token', () => {
    tokenStorage.set('old');
    tokenStorage.set('new');
    expect(tokenStorage.get()).toBe('new');
  });
});

import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API } from '../../testing/http';
import { AuthFacade } from './auth.facade';
import { jwtInterceptor } from './jwt.interceptor';

describe('jwtInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let accessToken: WritableSignal<string | null>;
  let refreshToken: ReturnType<typeof vi.fn>;

  function setUp(token: string | null) {
    accessToken = signal(token);
    refreshToken = vi.fn(async () => accessToken.set('new-token'));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthFacade, useValue: { accessToken, refreshToken } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  }

  /** Lets the async refresh settle before inspecting the retried request. */
  const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve));

  afterEach(() => backend.verify());

  it('adds the Bearer token to API requests', () => {
    setUp('token');

    http.get(`${API}/courts`).subscribe();

    expect(backend.expectOne(`${API}/courts`).request.headers.get('Authorization')).toBe('Bearer token');
  });

  it('sends no Authorization header without a session', () => {
    setUp(null);

    http.get(`${API}/courts`).subscribe();

    expect(backend.expectOne(`${API}/courts`).request.headers.has('Authorization')).toBe(false);
  });

  it('never sends the token to other origins', () => {
    setUp('token');

    http.get('https://example.com/data').subscribe();

    expect(backend.expectOne('https://example.com/data').request.headers.has('Authorization')).toBe(false);
  });

  it('on 401 refreshes the access token once and retries with the new one', async () => {
    setUp('expired-token');
    const response = firstValueFrom(http.get<{ ok: boolean }>(`${API}/courts`));

    backend.expectOne(`${API}/courts`).flush({}, { status: 401, statusText: 'Unauthorized' });
    await flushMicrotasks();
    const retry = backend.expectOne(`${API}/courts`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
    retry.flush({ ok: true });

    await expect(response).resolves.toEqual({ ok: true });
    expect(refreshToken).toHaveBeenCalledTimes(1);
  });

  it('gives up when the retried request is still 401', async () => {
    setUp('expired-token');
    const response = firstValueFrom(http.get(`${API}/courts`));

    backend.expectOne(`${API}/courts`).flush({}, { status: 401, statusText: 'Unauthorized' });
    await flushMicrotasks();
    backend.expectOne(`${API}/courts`).flush({}, { status: 401, statusText: 'Unauthorized' });

    await expect(response).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(refreshToken).toHaveBeenCalledTimes(1);
  });

  it('propagates the original 401 when the refresh fails', async () => {
    setUp('expired-token');
    refreshToken.mockRejectedValue(new Error('refresh failed'));
    const response = firstValueFrom(http.get(`${API}/courts`));

    backend.expectOne(`${API}/courts`).flush({}, { status: 401, statusText: 'Unauthorized' });

    await expect(response).rejects.toMatchObject({ status: 401 });
  });

  it('does not try to refresh for the auth endpoints themselves', async () => {
    setUp('token');
    const response = firstValueFrom(http.post(`${API}/auth/refresh`, { refreshToken: 'r' }));

    backend.expectOne(`${API}/auth/refresh`).flush({}, { status: 401, statusText: 'Unauthorized' });

    await expect(response).rejects.toMatchObject({ status: 401 });
    expect(refreshToken).not.toHaveBeenCalled();
  });

  it('does not refresh other errors', async () => {
    setUp('token');
    const response = firstValueFrom(http.get(`${API}/courts`));

    backend.expectOne(`${API}/courts`).flush({}, { status: 403, statusText: 'Forbidden' });

    await expect(response).rejects.toMatchObject({ status: 403 });
    expect(refreshToken).not.toHaveBeenCalled();
  });
});

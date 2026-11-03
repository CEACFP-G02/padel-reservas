import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthFacade } from './auth.facade';
import { jwtInterceptor } from './jwt.interceptor';

describe('jwtInterceptor', () => {
  const api = environment.apiBaseUrl;
  const unauthorized = { status: 401, statusText: 'Unauthorized' };
  let http: HttpClient;
  let controller: HttpTestingController;
  let accessToken: WritableSignal<string | null>;
  let refreshToken: ReturnType<typeof vi.fn>;

  function setup(token: string | null): void {
    accessToken = signal(token);
    refreshToken = vi.fn(async () => accessToken.set('new-access'));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthFacade, useValue: { accessToken, refreshToken } },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  }

  /** Lets the async refresh settle before inspecting the retried request. */
  const settle = () => new Promise((resolve) => setTimeout(resolve));

  afterEach(() => controller.verify());

  it('adds the bearer token to API requests', () => {
    setup('access');
    http.get(`${api}/courts`).subscribe();
    expect(controller.expectOne(`${api}/courts`).request.headers.get('Authorization')).toBe('Bearer access');
  });

  it('sends no header when signed out', () => {
    setup(null);
    http.get(`${api}/courts`).subscribe();
    expect(controller.expectOne(`${api}/courts`).request.headers.has('Authorization')).toBe(false);
  });

  it('never sends the token to other hosts', () => {
    setup('access');
    http.get('https://example.com/data').subscribe();
    expect(controller.expectOne('https://example.com/data').request.headers.has('Authorization')).toBe(false);
  });

  it('on 401 refreshes the access token once and retries with the new one', async () => {
    setup('expired');
    const response = firstValueFrom(http.get<{ ok: boolean }>(`${api}/me/bookings`));

    controller.expectOne(`${api}/me/bookings`).flush({}, unauthorized);
    await settle();
    const retry = controller.expectOne(`${api}/me/bookings`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-access');
    retry.flush({ ok: true });

    await expect(response).resolves.toEqual({ ok: true });
    expect(refreshToken).toHaveBeenCalledTimes(1);
  });

  it('gives up when the retried request is still 401', async () => {
    setup('expired');
    const response = firstValueFrom(http.get(`${api}/me/bookings`));

    controller.expectOne(`${api}/me/bookings`).flush({}, unauthorized);
    await settle();
    controller.expectOne(`${api}/me/bookings`).flush({}, unauthorized);

    await expect(response).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(refreshToken).toHaveBeenCalledTimes(1);
  });

  it('propagates the original 401 when the refresh fails', async () => {
    setup('expired');
    refreshToken.mockRejectedValue(new Error('refresh failed'));
    const response = firstValueFrom(http.get(`${api}/me/bookings`));

    controller.expectOne(`${api}/me/bookings`).flush({}, unauthorized);

    await expect(response).rejects.toMatchObject({ status: 401 });
  });

  it('does not try to refresh for the auth endpoints themselves', async () => {
    setup('access');
    const response = firstValueFrom(http.post(`${api}/auth/login`, {}));

    controller.expectOne(`${api}/auth/login`).flush({}, unauthorized);

    await expect(response).rejects.toMatchObject({ status: 401 });
    expect(refreshToken).not.toHaveBeenCalled();
  });

  it('does not refresh on other errors', async () => {
    setup('access');
    const response = firstValueFrom(http.get(`${api}/me/bookings`));

    controller.expectOne(`${api}/me/bookings`).flush({}, { status: 403, statusText: 'Forbidden' });

    await expect(response).rejects.toMatchObject({ status: 403 });
    expect(refreshToken).not.toHaveBeenCalled();
  });
});

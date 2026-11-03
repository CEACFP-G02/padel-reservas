import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AuthApi } from './auth.api';

describe('AuthApi', () => {
  const base = `${environment.apiBaseUrl}/auth`;
  let api: AuthApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(AuthApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('register POSTs /auth/register', () => {
    const body = { name: 'Ana', email: 'ana@example.com', password: 'secret123' };
    api.register(body).subscribe();
    const req = http.expectOne(`${base}/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
  });

  it('login POSTs /auth/login', () => {
    const body = { email: 'ana@example.com', password: 'secret123' };
    api.login(body).subscribe();
    const req = http.expectOne(`${base}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
  });

  it('me GETs /auth/me', () => {
    api.me().subscribe();
    expect(http.expectOne(`${base}/me`).request.method).toBe('GET');
  });

  it('refresh POSTs /auth/refresh', () => {
    api.refresh({ refreshToken: 'refresh' }).subscribe();
    const req = http.expectOne(`${base}/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'refresh' });
  });
});

import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { LoginResponse, RefreshTokenResponse, Role, User } from '../../shared/models';
import { API, setUpHttp } from '../../testing/http';
import { AuthApi } from './auth.api';

describe('AuthApi', () => {
  const user: User = { id: 1, name: 'Dueño', email: 'owner@padel.test', phone: null, role: Role.OWNER };
  let api: AuthApi;
  let http: HttpTestingController;

  beforeEach(() => {
    http = setUpHttp();
    api = TestBed.inject(AuthApi);
  });

  afterEach(() => http.verify());

  it('login POSTs credentials and returns both tokens plus the user', () => {
    let response: LoginResponse | undefined;
    api.login({ email: 'owner@padel.test', password: 'secret' }).subscribe((r) => (response = r));

    const req = http.expectOne(`${API}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'owner@padel.test', password: 'secret' });
    req.flush({ accessToken: 'a', refreshToken: 'r', user });

    expect(response?.user.name).toBe('Dueño');
  });

  it('refresh POSTs the refresh token and returns only a new access token', () => {
    let response: RefreshTokenResponse | undefined;
    api.refresh('r').subscribe((r) => (response = r));

    const req = http.expectOne(`${API}/auth/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'r' });
    req.flush({ accessToken: 'a2' });

    expect(response).toEqual({ accessToken: 'a2' });
  });

  it('me GETs /auth/me', () => {
    api.me().subscribe();
    expect(http.expectOne(`${API}/auth/me`).request.method).toBe('GET');
  });

  it('updateMe PATCHes /auth/me with the changed fields', () => {
    api.updateMe({ phone: '600000000' }).subscribe();

    const req = http.expectOne(`${API}/auth/me`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ phone: '600000000' });
  });
});

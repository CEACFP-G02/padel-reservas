import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { environment } from '../../../environments/environment';
import { Role, User } from '../../shared/models';
import { fakeJwt } from '../../testing/fake-jwt';
import { AuthFacade } from './auth.facade';
import { readTokens, writeTokens } from './token-storage';

describe('AuthFacade', () => {
  const base = `${environment.apiBaseUrl}/auth`;
  const ana: User = { id: 42, name: 'Ana', email: 'ana@example.com', phone: null, role: Role.CLIENT };
  const owner: User = { id: 1, name: 'Dueño', email: 'owner@example.com', phone: null, role: Role.OWNER };
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;

  function setup(): AuthFacade {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    return TestBed.inject(AuthFacade);
  }

  const unauthorized = { status: 401, statusText: 'Unauthorized' };

  beforeEach(() => localStorage.clear());
  afterEach(() => http.verify());

  it('starts signed out when no token is stored', () => {
    const auth = setup();
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.role()).toBeNull();
    expect(auth.isClient()).toBe(false);
    expect(auth.currentUser()).toBeNull();
  });

  it('restores the session and role from a stored token', () => {
    writeTokens({ accessToken: fakeJwt({ role: Role.CLIENT }), refreshToken: 'refresh' });
    const auth = setup();
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.role()).toBe(Role.CLIENT);
    expect(auth.isClient()).toBe(true);
  });

  it('is not a client when the token carries the OWNER role', () => {
    writeTokens({ accessToken: fakeJwt({ role: Role.OWNER }), refreshToken: 'refresh' });
    expect(setup().isClient()).toBe(false);
  });

  describe('login', () => {
    it('stores both tokens and exposes the user and role', async () => {
      const auth = setup();

      const done = auth.login({ email: 'ana@example.com', password: 'secret123' });
      const req = http.expectOne(`${base}/login`);
      expect(req.request.body).toEqual({ email: 'ana@example.com', password: 'secret123' });
      req.flush({ accessToken: 'access', refreshToken: 'refresh', user: ana });
      await done;

      expect(readTokens()).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
      expect(auth.accessToken()).toBe('access');
      expect(auth.currentUser()).toEqual(ana);
      expect(auth.role()).toBe(Role.CLIENT);
      expect(auth.isClient()).toBe(true);
    });

    it('rejects an OWNER account without keeping its tokens', async () => {
      const auth = setup();

      const done = auth.login({ email: 'owner@example.com', password: 'secret123' });
      http.expectOne(`${base}/login`).flush({ accessToken: 'access', refreshToken: 'refresh', user: owner });

      await expect(done).rejects.toThrow('Esta app es para clientes. Usa el panel web de administración');
      expect(readTokens()).toBeNull();
      expect(auth.isAuthenticated()).toBe(false);
    });

    it('explains wrong credentials (401) in Spanish', async () => {
      const auth = setup();

      const done = auth.login({ email: 'ana@example.com', password: 'wrong' });
      http.expectOne(`${base}/login`).flush({ status: 401 }, unauthorized);

      await expect(done).rejects.toThrow('Email o contraseña incorrectos');
    });

    it('explains an unreachable server', async () => {
      const auth = setup();

      const done = auth.login({ email: 'ana@example.com', password: 'secret123' });
      http.expectOne(`${base}/login`).error(new ProgressEvent('error'), { status: 0 });

      await expect(done).rejects.toThrow('No se pudo conectar con el servidor');
    });
  });

  describe('register', () => {
    it('creates the account (201) and then logs in with the same credentials', async () => {
      const auth = setup();

      const done = auth.register({ name: 'Ana', email: 'ana@example.com', password: 'secret123', phone: '600000000' });
      const register = http.expectOne(`${base}/register`);
      expect(register.request.body).toEqual({
        name: 'Ana',
        email: 'ana@example.com',
        password: 'secret123',
        phone: '600000000',
      });
      register.flush(ana, { status: 201, statusText: 'Created' });
      await new Promise((resolve) => setTimeout(resolve));
      const login = http.expectOne(`${base}/login`);
      expect(login.request.body).toEqual({ email: 'ana@example.com', password: 'secret123' });
      login.flush({ accessToken: 'access', refreshToken: 'refresh', user: ana });
      await done;

      expect(readTokens()).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
      expect(auth.currentUser()).toEqual(ana);
      expect(auth.isClient()).toBe(true);
    });

    it('never sends a role: self-registration is always CLIENT', async () => {
      const auth = setup();

      const done = auth.register({ name: 'Ana', email: 'ana@example.com', password: 'secret123' });
      const register = http.expectOne(`${base}/register`);
      expect(register.request.body).not.toHaveProperty('role');
      register.flush(ana, { status: 201, statusText: 'Created' });
      await new Promise((resolve) => setTimeout(resolve));
      http.expectOne(`${base}/login`).flush({ accessToken: 'access', refreshToken: 'refresh', user: ana });
      await done;
    });

    it('explains a duplicate email (409) and does not log in', async () => {
      const auth = setup();

      const done = auth.register({ name: 'Ana', email: 'ana@example.com', password: 'secret123' });
      http.expectOne(`${base}/register`).flush({ status: 409 }, { status: 409, statusText: 'Conflict' });

      await expect(done).rejects.toThrow('Ya existe una cuenta con ese email');
      http.expectNone(`${base}/login`);
      expect(auth.isAuthenticated()).toBe(false);
    });

    it('explains invalid data (400)', async () => {
      const auth = setup();

      const done = auth.register({ name: 'Ana', email: 'ana@example.com', password: 'short' });
      http.expectOne(`${base}/register`).flush({ status: 400 }, { status: 400, statusText: 'Bad Request' });

      await expect(done).rejects.toThrow('Revisa los datos del formulario');
    });
  });

  describe('refreshToken', () => {
    it('replaces only the access token', async () => {
      writeTokens({ accessToken: 'old', refreshToken: 'refresh' });
      const auth = setup();

      const done = auth.refreshToken();
      const req = http.expectOne(`${base}/refresh`);
      expect(req.request.body).toEqual({ refreshToken: 'refresh' });
      req.flush({ accessToken: 'new' });
      await done;

      expect(auth.accessToken()).toBe('new');
      expect(readTokens()).toEqual({ accessToken: 'new', refreshToken: 'refresh' });
    });

    it('shares one request between concurrent callers', async () => {
      writeTokens({ accessToken: 'old', refreshToken: 'refresh' });
      const auth = setup();

      const both = Promise.all([auth.refreshToken(), auth.refreshToken()]);
      http.expectOne(`${base}/refresh`).flush({ accessToken: 'new' });
      await both;

      expect(auth.accessToken()).toBe('new');
    });

    it('signs out and goes to /login when the refresh fails', async () => {
      writeTokens({ accessToken: 'old', refreshToken: 'expired' });
      const auth = setup();

      const done = auth.refreshToken();
      http.expectOne(`${base}/refresh`).flush({}, unauthorized);

      await expect(done).rejects.toBeTruthy();
      expect(auth.isAuthenticated()).toBe(false);
      expect(readTokens()).toBeNull();
      expect(navigate).toHaveBeenCalledWith('/login');
    });

    it('fails without a request when there is no session', async () => {
      const auth = setup();

      await expect(auth.refreshToken()).rejects.toBeTruthy();
      http.expectNone(`${base}/refresh`);
    });
  });

  it('loadCurrentUser loads /auth/me into currentUser', async () => {
    writeTokens({ accessToken: fakeJwt({ role: Role.CLIENT }), refreshToken: 'refresh' });
    const auth = setup();

    const done = auth.loadCurrentUser();
    http.expectOne(`${base}/me`).flush(ana);
    await done;

    expect(auth.currentUser()).toEqual(ana);
  });

  it('logout clears the session and goes to /login', () => {
    writeTokens({ accessToken: fakeJwt({ role: Role.CLIENT }), refreshToken: 'refresh' });
    const auth = setup();

    auth.logout();

    expect(auth.isAuthenticated()).toBe(false);
    expect(readTokens()).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});

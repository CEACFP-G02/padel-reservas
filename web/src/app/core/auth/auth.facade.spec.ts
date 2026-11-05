import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { Role, User } from '../../shared/models';
import { API } from '../../testing/http';
import { AuthFacade } from './auth.facade';
import { readTokens, writeTokens } from './token-storage';

/** Unsigned JWT with the given payload (the client only decodes it). */
function jwt(payload: Record<string, unknown>): string {
  const encode = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'HS256' })}.${encode(payload)}.signature`;
}

const owner: User = { id: 1, name: 'Dueño', email: 'owner@padel.test', phone: null, role: Role.OWNER };
const client: User = { id: 2, name: 'Ana', email: 'ana@padel.test', phone: null, role: Role.CLIENT };
const OWNER_TOKEN = jwt({ sub: 'owner@padel.test', role: 'OWNER', typ: 'access' });

describe('AuthFacade', () => {
  let http: HttpTestingController;
  let router: Router;

  function create(): AuthFacade {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    return TestBed.inject(AuthFacade);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => http.verify());

  it('starts signed out', () => {
    const auth = create();

    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.currentUser()).toBeNull();
    expect(auth.role()).toBeNull();
    expect(auth.isOwner()).toBe(false);
  });

  it('restores the session and role from stored tokens after a reload', () => {
    writeTokens({ accessToken: OWNER_TOKEN, refreshToken: 'r' });

    const auth = create();

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.accessToken()).toBe(OWNER_TOKEN);
    expect(auth.role()).toBe(Role.OWNER);
    expect(auth.isOwner()).toBe(true);
  });

  describe('login', () => {
    it('stores both tokens and exposes the user and role', async () => {
      const auth = create();

      const done = auth.login({ email: 'owner@padel.test', password: 'secret' });
      const req = http.expectOne(`${API}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'owner@padel.test', password: 'secret' });
      req.flush({ accessToken: 'a', refreshToken: 'r', user: owner });
      await done;

      expect(readTokens()).toEqual({ accessToken: 'a', refreshToken: 'r' });
      expect(auth.accessToken()).toBe('a');
      expect(auth.currentUser()).toEqual(owner);
      expect(auth.role()).toBe(Role.OWNER);
      expect(auth.isOwner()).toBe(true);
    });

    it('rejects a CLIENT account without keeping its tokens', async () => {
      const auth = create();

      const done = auth.login({ email: 'ana@padel.test', password: 'secret' });
      http.expectOne(`${API}/auth/login`).flush({ accessToken: 'a', refreshToken: 'r', user: client });

      await expect(done).rejects.toThrow('Esta cuenta no tiene acceso al panel de administración');
      expect(readTokens()).toBeNull();
      expect(auth.isAuthenticated()).toBe(false);
      expect(auth.currentUser()).toBeNull();
    });

    it('explains wrong credentials (401) in Spanish', async () => {
      const auth = create();

      const done = auth.login({ email: 'owner@padel.test', password: 'wrong' });
      http.expectOne(`${API}/auth/login`).flush(
        { status: 401, message: 'Invalid email or password' },
        { status: 401, statusText: 'Unauthorized' },
      );

      await expect(done).rejects.toThrow('Email o contraseña incorrectos');
      expect(auth.isAuthenticated()).toBe(false);
    });

    it('explains an unreachable server', async () => {
      const auth = create();

      const done = auth.login({ email: 'owner@padel.test', password: 'secret' });
      http.expectOne(`${API}/auth/login`).error(new ProgressEvent('error'), { status: 0 });

      await expect(done).rejects.toThrow('No se pudo conectar con el servidor');
    });
  });

  describe('refreshToken', () => {
    it('replaces only the access token', async () => {
      writeTokens({ accessToken: 'old', refreshToken: 'r' });
      const auth = create();

      const done = auth.refreshToken();
      const req = http.expectOne(`${API}/auth/refresh`);
      expect(req.request.body).toEqual({ refreshToken: 'r' });
      req.flush({ accessToken: 'new' });
      await done;

      expect(auth.accessToken()).toBe('new');
      expect(readTokens()).toEqual({ accessToken: 'new', refreshToken: 'r' });
    });

    it('shares one request between concurrent callers', async () => {
      writeTokens({ accessToken: 'old', refreshToken: 'r' });
      const auth = create();

      const both = Promise.all([auth.refreshToken(), auth.refreshToken()]);
      http.expectOne(`${API}/auth/refresh`).flush({ accessToken: 'new' });
      await both;

      expect(auth.accessToken()).toBe('new');
    });

    it('signs out and goes to /login when the refresh fails', async () => {
      writeTokens({ accessToken: 'old', refreshToken: 'expired' });
      const auth = create();

      const done = auth.refreshToken();
      http.expectOne(`${API}/auth/refresh`).flush({}, { status: 401, statusText: 'Unauthorized' });

      await expect(done).rejects.toBeTruthy();
      expect(auth.isAuthenticated()).toBe(false);
      expect(readTokens()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('fails without a request when there is no session', async () => {
      const auth = create();

      await expect(auth.refreshToken()).rejects.toBeTruthy();
      http.expectNone(`${API}/auth/refresh`);
    });
  });

  it('loadCurrentUser loads /auth/me into currentUser', async () => {
    writeTokens({ accessToken: OWNER_TOKEN, refreshToken: 'r' });
    const auth = create();

    const done = auth.loadCurrentUser();
    const req = http.expectOne(`${API}/auth/me`);
    expect(req.request.method).toBe('GET');
    req.flush(owner);
    await done;

    expect(auth.currentUser()).toEqual(owner);
  });

  it('logout clears the session and goes to /login', () => {
    writeTokens({ accessToken: OWNER_TOKEN, refreshToken: 'r' });
    const auth = create();

    auth.logout();

    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.role()).toBeNull();
    expect(readTokens()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it.todo('updateProfile PATCHes /auth/me and replaces currentUser');
});

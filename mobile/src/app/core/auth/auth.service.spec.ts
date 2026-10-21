import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { Role } from '../../shared/models';
import { fakeJwt } from '../../testing/fake-jwt';
import { AuthService } from './auth.service';
import { readTokens, writeTokens } from './token-storage';

describe('AuthService', () => {
  function setup(): AuthService {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    return TestBed.inject(AuthService);
  }

  beforeEach(() => localStorage.clear());

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

  it('logout clears the session and goes to /login', () => {
    writeTokens({ accessToken: fakeJwt({ role: Role.CLIENT }), refreshToken: 'refresh' });
    const auth = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    auth.logout();

    expect(auth.isAuthenticated()).toBe(false);
    expect(readTokens()).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it.todo('register creates the account (201) and then logs in');
  it.todo('login stores tokens and sets currentUser from the response');
  it.todo('refreshToken replaces the access token, logs out on failure');
});

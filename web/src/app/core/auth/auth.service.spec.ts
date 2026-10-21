import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    auth = TestBed.inject(AuthService);
  });

  it('starts signed out', () => {
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.currentUser()).toBeNull();
    expect(auth.isOwner()).toBe(false);
  });

  it.todo('login stores both tokens and the returned user; rejects non-OWNER accounts');
  it.todo('refreshToken replaces only the access token; logs out on failure');
  it.todo('loadCurrentUser loads /auth/me after a reload');
  it.todo('updateProfile PATCHes /auth/me and replaces currentUser');
});

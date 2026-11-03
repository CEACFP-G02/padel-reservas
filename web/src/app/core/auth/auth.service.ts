import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { LoginRequest, Role, UpdateProfileRequest, User } from '../../shared/models';
import { todo } from '../../shared/util/todo';
import { AuthApi } from './auth.api';
import { StoredTokens, decodeJwtPayload, readTokens, writeTokens } from './token-storage';

/** Session state (JWT + current user) exposed as signals. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi);
  private readonly router = inject(Router);

  private readonly tokens = signal<StoredTokens | null>(readTokens());
  private readonly _currentUser = signal<User | null>(null);

  readonly accessToken = computed(() => this.tokens()?.accessToken ?? null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.accessToken() !== null);

  /** Role from the loaded profile, falling back to the `role` claim of the access token (e.g. after a reload). */
  readonly role = computed<Role | null>(() => {
    const user = this._currentUser();
    if (user) return user.role;
    const token = this.accessToken();
    return token ? ((decodeJwtPayload(token)?.['role'] as Role | undefined) ?? null) : null;
  });

  readonly isOwner = computed(() => this.role() === Role.OWNER);

  async login(credentials: LoginRequest): Promise<void> {
    // TODO: api.login(credentials) -> reject if user.role !== OWNER; setTokens({ accessToken, refreshToken });
    //  _currentUser.set(user) — see docs/api.md#auth--apiv1auth
    todo('AuthService.login', 'auth--apiv1auth');
  }

  async refreshToken(): Promise<void> {
    // TODO: api.refresh(stored refreshToken) -> setTokens({ ...current, accessToken }) (the refresh token is kept);
    //  logout() on failure — see docs/api.md#auth--apiv1auth
    todo('AuthService.refreshToken', 'auth--apiv1auth');
  }

  /** Restores the profile after a reload (login already returns the user). */
  async loadCurrentUser(): Promise<void> {
    // TODO: api.me() -> _currentUser.set(user) — see docs/api.md#auth--apiv1auth
    todo('AuthService.loadCurrentUser', 'auth--apiv1auth');
  }

  async updateProfile(request: UpdateProfileRequest): Promise<void> {
    // TODO: api.updateMe(request) -> _currentUser.set(user) — see docs/api.md#users--clients--apiv1users
    todo('AuthService.updateProfile', 'users--clients--apiv1users');
  }

  logout(): void {
    this.setTokens(null);
    this._currentUser.set(null);
    void this.router.navigate(['/login']);
  }

  private setTokens(tokens: StoredTokens | null): void {
    writeTokens(tokens);
    this.tokens.set(tokens);
  }
}

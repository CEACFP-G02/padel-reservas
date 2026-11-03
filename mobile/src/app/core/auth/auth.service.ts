import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { LoginRequest, RegisterRequest, Role, User } from '../../shared/models';
import { todo } from '../../shared/util/todo';
import { AuthApi } from './auth.api';
import { StoredTokens, clearTokens, decodeJwtPayload, readTokens } from './token-storage';

/** Client session (JWT + current user) as signals. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi);
  private readonly router = inject(Router);

  private readonly tokens = signal<StoredTokens | null>(readTokens());
  private readonly _currentUser = signal<User | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly accessToken = computed(() => this.tokens()?.accessToken ?? null);
  readonly isAuthenticated = computed(() => this.accessToken() !== null);

  /** From the loaded user, else from the token's `role` claim (e.g. after an app restart). */
  readonly role = computed<Role | null>(() => {
    const user = this._currentUser();
    if (user) return user.role;
    const token = this.accessToken();
    return token ? ((decodeJwtPayload(token)?.['role'] as Role | undefined) ?? null) : null;
  });

  readonly isClient = computed(() => this.role() === Role.CLIENT);

  async register(request: RegisterRequest): Promise<void> {
    // TODO: api.register(request) (201 + user, no tokens) then login({ email, password })
    todo('AuthService.register', 'auth--apiv1auth');
  }

  async login(credentials: LoginRequest): Promise<void> {
    // TODO: api.login -> writeTokens + tokens.set + _currentUser.set(response.user); reject non-CLIENT users
    todo('AuthService.login', 'auth--apiv1auth');
  }

  async refreshToken(): Promise<void> {
    // TODO: api.refresh({ refreshToken }) -> keep refresh token, replace access token; logout() on failure
    todo('AuthService.refreshToken', 'auth--apiv1auth');
  }

  /** Lets the profile feature publish a freshly loaded/updated user. */
  setCurrentUser(user: User): void {
    this._currentUser.set(user);
  }

  logout(): void {
    clearTokens();
    this.tokens.set(null);
    this._currentUser.set(null);
    void this.router.navigateByUrl('/login');
  }
}

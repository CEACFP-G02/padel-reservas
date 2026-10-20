import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { CurrentUser, LoginRequest, Role } from '../../shared/models';
import { todo } from '../../shared/util/todo';
import { StoredTokens, decodeJwtPayload, readTokens, writeTokens } from './token-storage';

/** Session state (JWT + current user) exposed as signals. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  private readonly tokens = signal<StoredTokens | null>(readTokens());
  private readonly _currentUser = signal<CurrentUser | null>(null);

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
    // TODO: POST ${baseUrl}/login -> setTokens(response) -> loadCurrentUser(); reject non-OWNER accounts
    //  — see docs/api.md#post-apiv1authlogin
    todo('AuthService.login', 'post-apiv1authlogin');
  }

  async refreshToken(): Promise<void> {
    // TODO: POST ${baseUrl}/refresh with the stored refresh token -> setTokens(response); logout() on failure
    //  — see docs/api.md#post-apiv1authrefresh
    todo('AuthService.refreshToken', 'post-apiv1authrefresh');
  }

  async loadCurrentUser(): Promise<void> {
    // TODO: GET ${baseUrl}/me -> _currentUser.set(user) — see docs/api.md#get-apiv1authme
    todo('AuthService.loadCurrentUser', 'get-apiv1authme');
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

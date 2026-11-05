import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { LoginRequest, Role, UpdateProfileRequest, User } from '../../shared/models';
import { todo } from '../../shared/util/todo';
import { AuthApi } from './auth.api';
import { StoredTokens, decodeJwtPayload, readTokens, writeTokens } from './token-storage';

/**
 * Auth use cases of the OWNER (login, refresh, current user, logout) and the session they produce
 * (tokens, user, role) as signals. App-wide, so it lives in core: the guard, interceptor and shell read it.
 */
@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly api = inject(AuthApi);
  private readonly router = inject(Router);

  private readonly tokens = signal<StoredTokens | null>(readTokens());
  private readonly _currentUser = signal<User | null>(null);
  private refreshing: Promise<void> | null = null;

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

  /** Only OWNER accounts may use the admin panel: a CLIENT login is rejected and its tokens discarded. */
  async login(credentials: LoginRequest): Promise<void> {
    let response;
    try {
      response = await firstValueFrom(this.api.login(credentials));
    } catch (error) {
      throw new Error(loginErrorMessage(error));
    }
    if (response.user.role !== Role.OWNER) {
      throw new Error('Esta cuenta no tiene acceso al panel de administración');
    }
    this.setTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken });
    this._currentUser.set(response.user);
  }

  /** Exchanges the refresh token for a new access token; concurrent callers share one request. Signs out on failure. */
  refreshToken(): Promise<void> {
    this.refreshing ??= this.doRefresh().finally(() => (this.refreshing = null));
    return this.refreshing;
  }

  /** Restores the profile after a reload (login already returns the user). */
  async loadCurrentUser(): Promise<void> {
    this._currentUser.set(await firstValueFrom(this.api.me()));
  }

  async updateProfile(request: UpdateProfileRequest): Promise<void> {
    // TODO: api.updateMe(request) -> _currentUser.set(user) — see docs/api.md#users--clients--apiv1users
    todo('AuthFacade.updateProfile', 'users--clients--apiv1users');
  }

  logout(): void {
    this.setTokens(null);
    this._currentUser.set(null);
    void this.router.navigate(['/login']);
  }

  private async doRefresh(): Promise<void> {
    const current = this.tokens();
    if (!current) {
      throw new Error('No hay sesión que renovar');
    }
    try {
      const { accessToken } = await firstValueFrom(this.api.refresh(current.refreshToken));
      this.setTokens({ ...current, accessToken });
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  private setTokens(tokens: StoredTokens | null): void {
    writeTokens(tokens);
    this.tokens.set(tokens);
  }
}

function loginErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401) return 'Email o contraseña incorrectos';
    if (error.status === 0) return 'No se pudo conectar con el servidor';
  }
  return 'No se pudo iniciar sesión. Inténtalo de nuevo';
}

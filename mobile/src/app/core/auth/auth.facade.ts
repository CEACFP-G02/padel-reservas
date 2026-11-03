import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { LoginRequest, RegisterRequest, Role, User } from '../../shared/models';
import { AuthApi } from './auth.api';
import { StoredTokens, clearTokens, decodeJwtPayload, readTokens, writeTokens } from './token-storage';

const CONNECTION_ERROR = 'No se pudo conectar con el servidor';

/**
 * Auth use cases of the CLIENT (register, login, refresh, current user, logout) and the session they produce
 * (tokens, user, role) as signals. App-wide, so it lives in core: the guard, interceptor and profile read it.
 */
@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly api = inject(AuthApi);
  private readonly router = inject(Router);

  private readonly tokens = signal<StoredTokens | null>(readTokens());
  private readonly _currentUser = signal<User | null>(null);
  private refreshing: Promise<void> | null = null;

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

  /** Self sign-up: the server always creates a CLIENT (201 + user, no tokens), so we log in right after. */
  async register(request: RegisterRequest): Promise<void> {
    try {
      await firstValueFrom(this.api.register(request));
    } catch (error) {
      throw new Error(registerErrorMessage(error));
    }
    await this.login({ email: request.email, password: request.password });
  }

  /** Only CLIENT accounts may use the app: an OWNER login is rejected and its tokens discarded. */
  async login(credentials: LoginRequest): Promise<void> {
    let response;
    try {
      response = await firstValueFrom(this.api.login(credentials));
    } catch (error) {
      throw new Error(loginErrorMessage(error));
    }
    if (response.user.role !== Role.CLIENT) {
      throw new Error('Esta app es para clientes. Usa el panel web de administración');
    }
    this.setTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken });
    this._currentUser.set(response.user);
  }

  /** Exchanges the refresh token for a new access token; concurrent callers share one request. Signs out on failure. */
  refreshToken(): Promise<void> {
    this.refreshing ??= this.doRefresh().finally(() => (this.refreshing = null));
    return this.refreshing;
  }

  /** Restores the profile after an app restart (login already returns the user). */
  async loadCurrentUser(): Promise<void> {
    this._currentUser.set(await firstValueFrom(this.api.me()));
  }

  /** Lets the profile feature publish a freshly loaded/updated user. */
  setCurrentUser(user: User): void {
    this._currentUser.set(user);
  }

  logout(): void {
    this.setTokens(null);
    this._currentUser.set(null);
    void this.router.navigateByUrl('/login');
  }

  private async doRefresh(): Promise<void> {
    const current = this.tokens();
    if (!current) {
      throw new Error('No hay sesión que renovar');
    }
    try {
      const { accessToken } = await firstValueFrom(this.api.refresh({ refreshToken: current.refreshToken }));
      this.setTokens({ ...current, accessToken });
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  private setTokens(tokens: StoredTokens | null): void {
    if (tokens) {
      writeTokens(tokens);
    } else {
      clearTokens();
    }
    this.tokens.set(tokens);
  }
}

function loginErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401) return 'Email o contraseña incorrectos';
    if (error.status === 0) return CONNECTION_ERROR;
  }
  return 'No se pudo iniciar sesión. Inténtalo de nuevo';
}

function registerErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 409) return 'Ya existe una cuenta con ese email';
    if (error.status === 400) return 'Revisa los datos del formulario';
    if (error.status === 0) return CONNECTION_ERROR;
  }
  return 'No se pudo crear la cuenta. Inténtalo de nuevo';
}

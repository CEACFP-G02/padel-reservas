import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, RefreshTokenResponse, UpdateProfileRequest, User } from '../../shared/models';

/** REST client for `/auth` — see docs/api.md#auth--apiv1auth. */
@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  login(body: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, body);
  }

  refresh(refreshToken: string): Observable<RefreshTokenResponse> {
    return this.http.post<RefreshTokenResponse>(`${this.baseUrl}/refresh`, { refreshToken });
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/me`);
  }

  updateMe(body: UpdateProfileRequest): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/me`, body);
  }
}

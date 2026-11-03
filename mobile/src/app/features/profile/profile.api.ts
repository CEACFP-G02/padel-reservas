import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { UpdateProfileRequest, User } from '../../shared/models';

/** Self profile via `/auth/me` (docs/api.md#users--clients--apiv1users). */
@Injectable({ providedIn: 'root' })
export class ProfileApi {
  private readonly http = inject(HttpClient);
  private readonly meUrl = `${environment.apiBaseUrl}/auth/me`;

  getMe(): Observable<User> {
    return this.http.get<User>(this.meUrl);
  }

  updateMe(body: UpdateProfileRequest): Observable<User> {
    return this.http.patch<User>(this.meUrl, body);
  }
}

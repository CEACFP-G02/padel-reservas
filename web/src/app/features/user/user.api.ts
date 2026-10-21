import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Booking,
  ClientQuery,
  CreateClientRequest,
  PageRequest,
  PageResponse,
  UpdateClientRequest,
  User,
} from '../../shared/models';
import { toHttpParams } from '../../shared/util/http-params';

/** REST client for `/users` (clients) — see docs/api.md#users--clients--apiv1users. */
@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/users`;

  list(query: ClientQuery = {}): Observable<PageResponse<User>> {
    return this.http.get<PageResponse<User>>(this.baseUrl, { params: toHttpParams(query) });
  }

  get(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  create(body: CreateClientRequest): Observable<User> {
    return this.http.post<User>(this.baseUrl, body);
  }

  update(id: number, body: UpdateClientRequest): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  bookings(id: number, page: PageRequest = {}): Observable<PageResponse<Booking>> {
    return this.http.get<PageResponse<Booking>>(`${this.baseUrl}/${id}/bookings`, { params: toHttpParams(page) });
  }
}

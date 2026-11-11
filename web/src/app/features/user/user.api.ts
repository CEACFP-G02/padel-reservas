import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Booking,
  Client,
  ClientQuery,
  CreateClientRequest,
  PageRequest,
  PageResponse,
  UpdateClientRequest,
} from '../../shared/models';
import { toHttpParams } from '../../shared/util/http-params';

/** REST client for `/users` (clients) — see docs/api.md#users--clients--apiv1users. */
@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/users`;

  list(query: ClientQuery = {}): Observable<PageResponse<Client>> {
    return this.http.get<PageResponse<Client>>(this.baseUrl, { params: toHttpParams(query) });
  }

  get(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.baseUrl}/${id}`);
  }

  create(body: CreateClientRequest): Observable<Client> {
    return this.http.post<Client>(this.baseUrl, body);
  }

  update(id: number, body: UpdateClientRequest): Observable<Client> {
    return this.http.patch<Client>(`${this.baseUrl}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  bookings(id: number, page: PageRequest = {}): Observable<PageResponse<Booking>> {
    return this.http.get<PageResponse<Booking>>(`${this.baseUrl}/${id}/bookings`, {
      params: toHttpParams(page),
    });
  }
}

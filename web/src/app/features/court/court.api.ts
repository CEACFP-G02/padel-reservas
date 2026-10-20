import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Court, CourtRequest } from '../../shared/models';

/** REST client for `/courts` — see docs/api.md#courts. */
@Injectable({ providedIn: 'root' })
export class CourtApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/courts`;

  list(includeInactive = false): Observable<Court[]> {
    const params = new HttpParams().set('includeInactive', includeInactive);
    return this.http.get<Court[]>(this.baseUrl, { params });
  }

  get(id: number): Observable<Court> {
    return this.http.get<Court>(`${this.baseUrl}/${id}`);
  }

  create(body: CourtRequest): Observable<Court> {
    return this.http.post<Court>(this.baseUrl, body);
  }

  update(id: number, body: CourtRequest): Observable<Court> {
    return this.http.put<Court>(`${this.baseUrl}/${id}`, body);
  }

  deactivate(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/deactivate`, null);
  }
}

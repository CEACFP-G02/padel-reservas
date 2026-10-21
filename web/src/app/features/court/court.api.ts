import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Court, CourtFilters, CourtRequest, PageResponse, UpdateCourtRequest } from '../../shared/models';
import { toHttpParams } from '../../shared/util/http-params';

/** REST client for `/courts` — see docs/api.md#courts--apiv1courts. */
@Injectable({ providedIn: 'root' })
export class CourtApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/courts`;

  list(filters: CourtFilters = {}): Observable<PageResponse<Court>> {
    return this.http.get<PageResponse<Court>>(this.baseUrl, { params: toHttpParams(filters) });
  }

  get(id: number): Observable<Court> {
    return this.http.get<Court>(`${this.baseUrl}/${id}`);
  }

  create(body: CourtRequest): Observable<Court> {
    return this.http.post<Court>(this.baseUrl, body);
  }

  update(id: number, body: UpdateCourtRequest): Observable<Court> {
    return this.http.patch<Court>(`${this.baseUrl}/${id}`, body);
  }

  /** Soft delete: the court becomes inactive, its bookings are kept. */
  deactivate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

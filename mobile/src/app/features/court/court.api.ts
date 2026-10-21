import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Court, CourtQuery, Page } from '../../shared/models';
import { toHttpParams } from '../../shared/util/http-params';

/** Read-only REST client for docs/api.md#courts--apiv1courts. */
@Injectable({ providedIn: 'root' })
export class CourtApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/courts`;

  list(query: CourtQuery = {}): Observable<Page<Court>> {
    return this.http.get<Page<Court>>(this.baseUrl, { params: toHttpParams(query) });
  }

  get(id: number): Observable<Court> {
    return this.http.get<Court>(`${this.baseUrl}/${id}`);
  }
}

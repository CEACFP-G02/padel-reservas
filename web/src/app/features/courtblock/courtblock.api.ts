import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CourtBlock, CourtBlockRequest, IsoDate } from '../../shared/models';

/** REST client for `/courts/{courtId}/blocks` — see docs/api.md#court-blocks. */
@Injectable({ providedIn: 'root' })
export class CourtBlockApi {
  private readonly http = inject(HttpClient);

  list(courtId: number, date?: IsoDate): Observable<CourtBlock[]> {
    const params = date ? new HttpParams().set('date', date) : undefined;
    return this.http.get<CourtBlock[]>(this.url(courtId), { params });
  }

  create(courtId: number, body: CourtBlockRequest): Observable<CourtBlock> {
    return this.http.post<CourtBlock>(this.url(courtId), body);
  }

  remove(courtId: number, blockId: number): Observable<void> {
    return this.http.delete<void>(`${this.url(courtId)}/${blockId}`);
  }

  private url(courtId: number): string {
    return `${environment.apiBaseUrl}/courts/${courtId}/blocks`;
  }
}

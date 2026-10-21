import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CourtBlock, CourtBlockRequest, IsoDate } from '../../shared/models';

/** REST client for court blocks — see docs/api.md#court-blocks-maintenance--apiv1courtsidblocks. */
@Injectable({ providedIn: 'root' })
export class CourtBlockApi {
  private readonly http = inject(HttpClient);

  list(courtId: number, date?: IsoDate): Observable<CourtBlock[]> {
    const params = date ? new HttpParams().set('date', date) : undefined;
    return this.http.get<CourtBlock[]>(this.courtBlocksUrl(courtId), { params });
  }

  create(courtId: number, body: CourtBlockRequest): Observable<CourtBlock> {
    return this.http.post<CourtBlock>(this.courtBlocksUrl(courtId), body);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/court-blocks/${id}`);
  }

  private courtBlocksUrl(courtId: number): string {
    return `${environment.apiBaseUrl}/courts/${courtId}/blocks`;
  }
}

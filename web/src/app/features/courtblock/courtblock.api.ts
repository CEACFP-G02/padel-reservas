import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BlockRange, CourtBlock, CourtBlockRequest } from '../../shared/models';
import { toHttpParams } from '../../shared/util/http-params';

/** REST client for court blocks — see docs/api.md#court-blocks-maintenance--apiv1courtsidblocks. */
@Injectable({ providedIn: 'root' })
export class CourtBlockApi {
  private readonly http = inject(HttpClient);

  list(courtId: number, range: BlockRange = {}): Observable<CourtBlock[]> {
    return this.http.get<CourtBlock[]>(this.courtBlocksUrl(courtId), {
      params: toHttpParams(range),
    });
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

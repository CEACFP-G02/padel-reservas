import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AvailabilityQuery,
  AvailabilityResponse,
  CourtDayAvailability,
  IsoDate,
} from '../../shared/models';
import { toHttpParams } from '../../shared/util/http-params';

/** REST client for computed availability — see docs/api.md#availability--apiv1availability-. */
@Injectable({ providedIn: 'root' })
export class AvailabilityApi {
  private readonly http = inject(HttpClient);

  getCourtDay(courtId: number, date: IsoDate): Observable<CourtDayAvailability> {
    const params = new HttpParams().set('date', date);
    return this.http.get<CourtDayAvailability>(
      `${environment.apiBaseUrl}/courts/${courtId}/availability`,
      { params },
    );
  }

  /** Slots with at least `courts` free courts (each lists its free `courtIds`), or nearby days. */
  search(query: AvailabilityQuery): Observable<AvailabilityResponse> {
    return this.http.get<AvailabilityResponse>(`${environment.apiBaseUrl}/availability`, {
      params: toHttpParams(query),
    });
  }
}

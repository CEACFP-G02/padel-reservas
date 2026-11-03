import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AvailabilityQuery, AvailabilityResponse } from '../../shared/models';
import { toHttpParams } from '../../shared/util/http-params';

/** REST client for docs/api.md#availability--apiv1availability-. */
@Injectable({ providedIn: 'root' })
export class AvailabilityApi {
  private readonly http = inject(HttpClient);

  search(query: AvailabilityQuery): Observable<AvailabilityResponse> {
    return this.http.get<AvailabilityResponse>(`${environment.apiBaseUrl}/availability`, {
      params: toHttpParams(query),
    });
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { DashboardSummary, IsoDate } from '../../shared/models';

/** REST client for `/dashboard` — see docs/api.md#dashboard--apiv1dashboard. */
@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);

  getSummary(from?: IsoDate, to?: IsoDate): Observable<DashboardSummary> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<DashboardSummary>(`${environment.apiBaseUrl}/dashboard/summary`, { params });
  }
}

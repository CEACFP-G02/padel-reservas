import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Schedule, UpdateScheduleRequest } from '../../shared/models';

/** REST client for `/courts/{courtId}/schedule` — see docs/api.md#schedule. */
@Injectable({ providedIn: 'root' })
export class ScheduleApi {
  private readonly http = inject(HttpClient);

  get(courtId: number): Observable<Schedule> {
    return this.http.get<Schedule>(this.url(courtId));
  }

  update(courtId: number, body: UpdateScheduleRequest): Observable<Schedule> {
    return this.http.put<Schedule>(this.url(courtId), body);
  }

  private url(courtId: number): string {
    return `${environment.apiBaseUrl}/courts/${courtId}/schedule`;
  }
}

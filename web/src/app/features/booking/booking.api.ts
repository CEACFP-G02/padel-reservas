import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Booking,
  BookingFilters,
  CreateBookingRequest,
  PageResponse,
  RescheduleBookingRequest,
} from '../../shared/models';
import { toHttpParams } from '../../shared/util/http-params';

/** REST client for `/bookings` — see docs/api.md#bookings--apiv1bookings. */
@Injectable({ providedIn: 'root' })
export class BookingApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/bookings`;

  list(filters: BookingFilters = {}): Observable<PageResponse<Booking>> {
    return this.http.get<PageResponse<Booking>>(this.baseUrl, { params: toHttpParams(filters) });
  }

  get(id: number): Observable<Booking> {
    return this.http.get<Booking>(`${this.baseUrl}/${id}`);
  }

  create(body: CreateBookingRequest): Observable<Booking> {
    return this.http.post<Booking>(this.baseUrl, body);
  }

  /** Soft-cancel: the booking stays with status CANCELLED (204, no body). */
  cancel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  reschedule(id: number, body: RescheduleBookingRequest): Observable<Booking> {
    return this.http.patch<Booking>(`${this.baseUrl}/${id}`, body);
  }
}

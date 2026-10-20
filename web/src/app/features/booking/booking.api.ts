import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Booking, BookingFilters, CreateBookingRequest, RescheduleBookingRequest } from '../../shared/models';

/** REST client for `/bookings` — see docs/api.md#bookings. */
@Injectable({ providedIn: 'root' })
export class BookingApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/bookings`;

  list(filters: BookingFilters = {}): Observable<Booking[]> {
    let params = new HttpParams();
    if (filters.courtId != null) params = params.set('courtId', filters.courtId);
    if (filters.date) params = params.set('date', filters.date);
    return this.http.get<Booking[]>(this.baseUrl, { params });
  }

  get(id: number): Observable<Booking> {
    return this.http.get<Booking>(`${this.baseUrl}/${id}`);
  }

  create(body: CreateBookingRequest): Observable<Booking> {
    return this.http.post<Booking>(this.baseUrl, body);
  }

  cancel(id: number): Observable<Booking> {
    return this.http.patch<Booking>(`${this.baseUrl}/${id}/cancel`, null);
  }

  reschedule(id: number, body: RescheduleBookingRequest): Observable<Booking> {
    return this.http.patch<Booking>(`${this.baseUrl}/${id}/reschedule`, body);
  }
}

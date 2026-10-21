import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Booking, CreateBookingRequest, MyBookingsQuery, Page } from '../../shared/models';
import { toHttpParams } from '../../shared/util/http-params';

/** REST client for the CLIENT side of docs/api.md#bookings--apiv1bookings. */
@Injectable({ providedIn: 'root' })
export class BookingApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  create(body: CreateBookingRequest): Observable<Booking> {
    return this.http.post<Booking>(`${this.baseUrl}/bookings`, body);
  }

  myBookings(query: MyBookingsQuery = {}): Observable<Page<Booking>> {
    return this.http.get<Page<Booking>>(`${this.baseUrl}/me/bookings`, { params: toHttpParams(query) });
  }

  get(id: number): Observable<Booking> {
    return this.http.get<Booking>(`${this.baseUrl}/bookings/${id}`);
  }

  cancel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/bookings/${id}`);
  }
}

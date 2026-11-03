import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Booking, CreateBookingRequest, MyBookingsQuery } from '../../shared/models';
import { todo } from '../../shared/util/todo';
import { BookingApi } from './booking.api';

/** CLIENT use cases on the client's own bookings. */
@Injectable({ providedIn: 'root' })
export class BookingFacade {
  private readonly api = inject(BookingApi);

  private readonly _myBookings = signal<Booking[]>([]);
  private readonly _selected = signal<Booking | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly myBookings = this._myBookings.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** UC: Create booking (for self) on one court. Resolves to `null` on failure, with `error` set. */
  async createBooking(request: CreateBookingRequest): Promise<Booking | null> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const booking = await firstValueFrom(this.api.create(request));
      this._myBookings.update((bookings) => [booking, ...bookings]);
      return booking;
    } catch (err) {
      const slotTaken = err instanceof HttpErrorResponse && err.status === 409;
      this._error.set(slotTaken ? 'Ese turno ya no está libre en esa pista. Vuelve a buscar.' : 'No se pudo crear la reserva.');
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /** UC: Get my bookings. */
  async getMyBookings(query: MyBookingsQuery = {}): Promise<void> {
    // TODO: api.myBookings(query) -> _myBookings.set(page.content) — see docs/api.md#bookings--apiv1bookings
    todo('BookingFacade.getMyBookings', 'bookings--apiv1bookings');
  }

  /** UC: Get booking (own only; the server answers 403/404 otherwise). */
  async getBooking(id: number): Promise<void> {
    // TODO: api.get(id) -> _selected — see docs/api.md#bookings--apiv1bookings
    todo('BookingFacade.getBooking', 'bookings--apiv1bookings');
  }

  /** UC: Cancel booking (server enforces the min-notice rule for clients). */
  async cancelBooking(id: number): Promise<void> {
    // TODO: api.cancel(id) -> status CANCELLED in _myBookings / _selected; surface min-notice error
    //  — see docs/api.md#bookings--apiv1bookings
    todo('BookingFacade.cancelBooking', 'bookings--apiv1bookings');
  }
}

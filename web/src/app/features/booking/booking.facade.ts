import { Injectable, inject, signal } from '@angular/core';

import { Booking, BookingFilters, CreateBookingRequest, RescheduleBookingRequest } from '../../shared/models';
import { todo } from '../../shared/util/todo';
import { BookingApi } from './booking.api';

/** OWNER use cases on bookings. */
@Injectable({ providedIn: 'root' })
export class BookingFacade {
  private readonly api = inject(BookingApi);

  private readonly _bookings = signal<Booking[]>([]);
  private readonly _selected = signal<Booking | null>(null);
  private readonly _filters = signal<BookingFilters>({});
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly bookings = this._bookings.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** UC: List bookings (optionally by court and/or date). */
  async listBookings(filters: BookingFilters = {}): Promise<void> {
    // TODO: _filters.set(filters); api.list(filters) -> _bookings — see docs/api.md#get-apiv1bookings
    todo('BookingFacade.listBookings', 'get-apiv1bookings');
  }

  /** UC: Get booking. */
  async getBooking(id: number): Promise<void> {
    // TODO: api.get(id) -> _selected — see docs/api.md#get-apiv1bookingsid
    todo('BookingFacade.getBooking', 'get-apiv1bookingsid');
  }

  /** UC: Create booking (manual, on behalf of a client). 409 = slot taken. */
  async createBooking(request: CreateBookingRequest): Promise<void> {
    // TODO: api.create(request) -> append; surface 409 SlotNotAvailable via _error — see docs/api.md#post-apiv1bookings
    todo('BookingFacade.createBooking', 'post-apiv1bookings');
  }

  /** UC: Cancel booking (the owner is not bound by the client min-notice rule). */
  async cancelBooking(id: number): Promise<void> {
    // TODO: api.cancel(id) -> replace in _bookings / _selected — see docs/api.md#patch-apiv1bookingsidcancel
    todo('BookingFacade.cancelBooking', 'patch-apiv1bookingsidcancel');
  }

  /** UC: Reschedule booking. 409 = target slot taken. */
  async rescheduleBooking(id: number, request: RescheduleBookingRequest): Promise<void> {
    // TODO: api.reschedule(id, request) -> replace in _bookings / _selected — see docs/api.md#patch-apiv1bookingsidreschedule
    todo('BookingFacade.rescheduleBooking', 'patch-apiv1bookingsidreschedule');
  }
}

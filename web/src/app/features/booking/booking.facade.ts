import { Injectable, inject, signal } from '@angular/core';

import { Booking, BookingFilters, CreateBookingRequest, PageMeta, RescheduleBookingRequest } from '../../shared/models';
import { todo } from '../../shared/util/todo';
import { BookingApi } from './booking.api';

/** OWNER use cases on bookings. */
@Injectable({ providedIn: 'root' })
export class BookingFacade {
  private readonly api = inject(BookingApi);

  private readonly _bookings = signal<Booking[]>([]);
  private readonly _page = signal<PageMeta | null>(null);
  private readonly _selected = signal<Booking | null>(null);
  private readonly _filters = signal<BookingFilters>({});
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly bookings = this._bookings.asReadonly();
  readonly page = this._page.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** UC: List bookings (date, court, client, status filters + pagination). */
  async listBookings(filters: BookingFilters = {}): Promise<void> {
    // TODO: _filters.set(filters); api.list(filters) -> _bookings.set(page.content), _page.set(meta)
    //  — see docs/api.md#bookings--apiv1bookings
    todo('BookingFacade.listBookings', 'bookings--apiv1bookings');
  }

  /** UC: Get booking. */
  async getBooking(id: number): Promise<void> {
    // TODO: api.get(id) -> _selected — see docs/api.md#bookings--apiv1bookings
    todo('BookingFacade.getBooking', 'bookings--apiv1bookings');
  }

  /** UC: Create booking (manual, on behalf of `clientId`). 409 = slot taken on that court. */
  async createBooking(request: CreateBookingRequest): Promise<void> {
    // TODO: api.create(request) -> prepend; surface 409 via _error — see docs/api.md#bookings--apiv1bookings
    todo('BookingFacade.createBooking', 'bookings--apiv1bookings');
  }

  /** UC: Cancel booking (the owner is not bound by the client min-notice rule). */
  async cancelBooking(id: number): Promise<void> {
    // TODO: api.cancel(id) (204) -> set status CANCELLED in _bookings / _selected
    //  — see docs/api.md#bookings--apiv1bookings
    todo('BookingFacade.cancelBooking', 'bookings--apiv1bookings');
  }

  /** UC: Reschedule booking. 409 = target slot taken. */
  async rescheduleBooking(id: number, request: RescheduleBookingRequest): Promise<void> {
    // TODO: api.reschedule(id, request) -> replace in _bookings / _selected — see docs/api.md#bookings--apiv1bookings
    todo('BookingFacade.rescheduleBooking', 'bookings--apiv1bookings');
  }
}

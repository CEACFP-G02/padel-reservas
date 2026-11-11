import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  Booking,
  BookingFilters,
  BookingStatus,
  CreateBookingRequest,
  PageMeta,
  RescheduleBookingRequest,
} from '../../shared/models';
import { todo } from '../../shared/util/todo';
import { BookingApi } from './booking.api';

/** A failed booking write, with a Spanish message for the UI. */
export class BookingError extends Error {}

/** Maps the documented cancel errors (docs/api.md#bookings--apiv1bookings) to Spanish. */
function cancelErrorOf(error: unknown): BookingError {
  const status = error instanceof HttpErrorResponse ? error.status : undefined;
  if (status === 409) {
    return new BookingError('La reserva ya no está confirmada; no se puede cancelar.');
  }
  if (status === 404) {
    return new BookingError('La reserva ya no existe.');
  }
  return new BookingError('No se pudo cancelar la reserva.');
}

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
    this._filters.set(filters);
    this._loading.set(true);
    this._error.set(null);
    try {
      const { content, ...meta } = await firstValueFrom(this.api.list(filters));
      this._bookings.set(content);
      this._page.set(meta);
    } catch {
      this._bookings.set([]);
      this._page.set(null);
      this._error.set('No se pudieron cargar las reservas.');
    } finally {
      this._loading.set(false);
    }
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

  /**
   * UC: Cancel booking (the owner is not bound by the client min-notice rule).
   * Rejects with a {@link BookingError}.
   */
  async cancelBooking(id: number): Promise<void> {
    try {
      await firstValueFrom(this.api.cancel(id));
    } catch (error) {
      throw cancelErrorOf(error);
    }
    const cancel = (booking: Booking): Booking =>
      booking.id === id ? { ...booking, status: BookingStatus.CANCELLED } : booking;
    this._bookings.update((bookings) => bookings.map(cancel));
    this._selected.update((booking) => booking && cancel(booking));
  }

  /** UC: Reschedule booking. 409 = target slot taken. */
  async rescheduleBooking(id: number, request: RescheduleBookingRequest): Promise<void> {
    // TODO: api.reschedule(id, request) -> replace in _bookings / _selected — see docs/api.md#bookings--apiv1bookings
    todo('BookingFacade.rescheduleBooking', 'bookings--apiv1bookings');
  }
}

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiError, Booking, BookingStatus, CreateBookingRequest, MyBookingsQuery } from '../../shared/models';
import { BookingApi } from './booking.api';

/** Spanish messages for the documented POST /bookings rejections (the API's own messages are in English). */
const BOOKING_ERRORS: Record<number, string> = {
  400: 'Ese turno ya no se puede reservar. Vuelve a buscar.',
  404: 'Esa pista ya no está disponible. Vuelve a buscar.',
  409: 'Ese turno ya no está libre en esa pista. Vuelve a buscar.',
};

const TOO_LATE_TO_CANCEL =
  'Ya no puedes cancelar esta reserva: solo se puede cancelar hasta 24 horas antes de que empiece.';

/** Spanish message for a failed DELETE /bookings/{id}. Both 409s are documented: min notice and not CONFIRMED. */
function cancelErrorOf(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) {
    return 'No se pudo cancelar la reserva.';
  }
  if (err.status === 409) {
    const message = (err.error as ApiError | null)?.message ?? '';
    return /^Booking \d+ is /.test(message) ? 'Esta reserva ya no está confirmada.' : TOO_LATE_TO_CANCEL;
  }
  if (err.status === 404) {
    return 'No se encontró la reserva.';
  }
  return 'No se pudo cancelar la reserva.';
}

/** CLIENT use cases on the client's own bookings. */
@Injectable({ providedIn: 'root' })
export class BookingFacade {
  private readonly api = inject(BookingApi);

  private readonly _myBookings = signal<Booking[]>([]);
  private readonly _selected = signal<Booking | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _slotTaken = signal(false);

  readonly myBookings = this._myBookings.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  /** The last createBooking failed because the slot was taken meanwhile (409): refresh availability. */
  readonly slotTaken = this._slotTaken.asReadonly();

  /** UC: Create booking (for self) on one court. Resolves to `null` on failure, with `error` set. */
  async createBooking(request: CreateBookingRequest): Promise<Booking | null> {
    this._loading.set(true);
    this._error.set(null);
    this._slotTaken.set(false);
    try {
      const booking = await firstValueFrom(this.api.create(request));
      this._myBookings.update((bookings) => [booking, ...bookings]);
      return booking;
    } catch (err) {
      const status = err instanceof HttpErrorResponse ? err.status : 0;
      this._slotTaken.set(status === 409);
      this._error.set(BOOKING_ERRORS[status] ?? 'No se pudo crear la reserva.');
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /** UC: Get my bookings (GET /me/bookings, most recent first). */
  async getMyBookings(query: MyBookingsQuery = {}): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      this._myBookings.set((await firstValueFrom(this.api.myBookings(query))).content);
    } catch {
      this._myBookings.set([]);
      this._error.set('No se pudieron cargar tus reservas.');
    } finally {
      this._loading.set(false);
    }
  }

  /** UC: Get booking (own only; someone else's is a 404, like a missing one). */
  async getBooking(id: number): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._selected.set(null);
    try {
      this._selected.set(await firstValueFrom(this.api.get(id)));
    } catch (err) {
      this._error.set(
        err instanceof HttpErrorResponse && err.status === 404 ? 'No se encontró la reserva.' : 'No se pudo cargar la reserva.',
      );
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * UC: Cancel booking. The server enforces the 24-hour min-notice rule (409).
   * Resolves to `false` on failure, with `error` set in Spanish.
   */
  async cancelBooking(id: number): Promise<boolean> {
    this._loading.set(true);
    this._error.set(null);
    try {
      await firstValueFrom(this.api.cancel(id));
    } catch (err) {
      this._error.set(cancelErrorOf(err));
      return false;
    } finally {
      this._loading.set(false);
    }
    const cancel = (booking: Booking): Booking =>
      booking.id === id ? { ...booking, status: BookingStatus.CANCELLED } : booking;
    this._myBookings.update((bookings) => bookings.map(cancel));
    this._selected.update((booking) => booking && cancel(booking));
    return true;
  }
}

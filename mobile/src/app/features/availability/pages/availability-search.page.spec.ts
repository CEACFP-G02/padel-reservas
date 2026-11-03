import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AlertController, provideIonicAngular, ToastController } from '@ionic/angular';

import {
  AvailabilityQuery,
  AvailabilityResponse,
  Booking,
  CreateBookingRequest,
  SlotResponse,
} from '../../../shared/models';
import { toIsoDate } from '../../../shared/util/date';
import { bookingFixture } from '../../../testing/fixtures';
import { BookingFacade } from '../../booking/booking.facade';
import { AvailabilityFacade } from '../availability.facade';
import { AvailabilitySearchPage } from './availability-search.page';

describe('AvailabilitySearchPage', () => {
  const result = signal<AvailabilityResponse | null>(null);
  const getAvailability = vi.fn<(query: AvailabilityQuery) => Promise<void>>().mockResolvedValue();
  const facade = {
    query: signal<AvailabilityQuery | null>(null),
    result,
    loading: signal(false),
    error: signal<string | null>(null),
    showAlternatives: computed(() => result()?.available === false),
    getAvailability,
  };

  type CreateBooking = (request: CreateBookingRequest) => Promise<Booking | null>;
  type Dismiss = { role?: string; data?: { values?: unknown } };
  let createBooking: ReturnType<typeof vi.fn<CreateBooking>>;
  let bookingError: ReturnType<typeof signal<string | null>>;
  let alertCreate: ReturnType<typeof vi.fn>;
  let toastCreate: ReturnType<typeof vi.fn>;

  function dismissPickerWith(dismiss: Dismiss): void {
    alertCreate.mockResolvedValue({ present: vi.fn(), onDidDismiss: vi.fn().mockResolvedValue(dismiss) });
  }

  function slot(courtIds: number[]): SlotResponse {
    return { start: '07:00', end: '08:00', courtsFree: courtIds.length, courtIds, price: 16 };
  }

  function render() {
    TestBed.configureTestingModule({
      imports: [AvailabilitySearchPage],
      providers: [
        provideRouter([]),
        provideIonicAngular(),
        { provide: AvailabilityFacade, useValue: facade },
        { provide: BookingFacade, useValue: { createBooking, error: bookingError } },
        { provide: AlertController, useValue: { create: alertCreate } },
        { provide: ToastController, useValue: { create: toastCreate } },
      ],
    });
    const fixture = TestBed.createComponent(AvailabilitySearchPage);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    result.set(null);
    getAvailability.mockClear();
    createBooking = vi.fn<CreateBooking>().mockResolvedValue(bookingFixture());
    bookingError = signal<string | null>(null);
    alertCreate = vi.fn();
    toastCreate = vi.fn().mockResolvedValue({ present: vi.fn() });
  });

  it('searches today for one court by default', () => {
    const fixture = render();
    fixture.componentInstance['search']();
    expect(getAvailability).toHaveBeenCalledWith({ date: toIsoDate(new Date()), courts: 1 });
  });

  it('searches with the chosen date and number of courts', () => {
    const page = render().componentInstance;
    page['date'].set('2026-06-08');
    page['courts'].set(2);
    page['search']();
    expect(getAvailability).toHaveBeenCalledWith({ date: '2026-06-08', courts: 2 });
  });

  it('lists the free slots when the day is available', () => {
    const fixture = render();
    result.set({
      requestedDate: '2026-06-08',
      courtsRequested: 2,
      available: true,
      slots: [slot([1, 2, 3])],
      alternativeDays: [],
    });
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('07:00 – 08:00');
    expect(text).not.toContain('Días cercanos');
  });

  it('offers nearby days when the day is full, and searches one when tapped', () => {
    const fixture = render();
    fixture.componentInstance['courts'].set(2);
    result.set({
      requestedDate: '2026-06-08',
      courtsRequested: 2,
      available: false,
      slots: [],
      alternativeDays: [{ date: '2026-06-09', freeSlotCount: 5 }],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Días cercanos');

    const day = fixture.nativeElement.querySelector('[data-testid="alternative-day"]') as HTMLElement;
    day.click();

    expect(fixture.componentInstance['date']()).toBe('2026-06-09');
    expect(getAvailability).toHaveBeenLastCalledWith({ date: '2026-06-09', courts: 2 });
  });

  describe('booking a slot', () => {
    const request = (courtId: number): CreateBookingRequest => ({
      courtId,
      date: '2026-06-08',
      slots: [{ start: '07:00', end: '08:00' }],
    });

    it('books the only free court directly, for the searched date', async () => {
      const page = render().componentInstance;
      page['date'].set('2026-06-10');
      await page['book']('2026-06-08', slot([3]));

      expect(alertCreate).not.toHaveBeenCalled();
      expect(createBooking).toHaveBeenCalledWith(request(3));
      expect(toastCreate).toHaveBeenCalledWith(expect.objectContaining({ message: 'Reserva confirmada: Court 3, 07:00' }));
    });

    it('lets the user pick one of several free courts, and books the chosen one', async () => {
      dismissPickerWith({ role: 'confirm', data: { values: 3 } });
      const page = render().componentInstance;
      await page['book']('2026-06-08', slot([1, 3]));

      const options = alertCreate.mock.calls[0][0] as { inputs: { type: string; value: number; label: string }[] };
      expect(options.inputs.map(({ type, value, label }) => ({ type, value, label }))).toEqual([
        { type: 'radio', value: 1, label: 'Pista 1' },
        { type: 'radio', value: 3, label: 'Pista 3' },
      ]);
      expect(createBooking).toHaveBeenCalledWith(request(3));
    });

    it('does not book when the court picker is cancelled', async () => {
      dismissPickerWith({ role: 'cancel' });
      const page = render().componentInstance;
      await page['book']('2026-06-08', slot([1, 3]));

      expect(createBooking).not.toHaveBeenCalled();
      expect(toastCreate).not.toHaveBeenCalled();
    });

    it('shows the booking error when the booking fails', async () => {
      createBooking.mockImplementation(async () => {
        bookingError.set('Ese turno ya no está libre en esa pista. Vuelve a buscar.');
        return null;
      });
      const page = render().componentInstance;
      await page['book']('2026-06-08', slot([3]));

      expect(toastCreate).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Ese turno ya no está libre en esa pista. Vuelve a buscar.', color: 'danger' }),
      );
    });

    it('wires the Reservar button of each slot to book it', () => {
      const fixture = render();
      const page = fixture.componentInstance as unknown as { book: (date: string, slot: SlotResponse) => Promise<void> };
      const book = vi.spyOn(page, 'book').mockResolvedValue();
      result.set({
        requestedDate: '2026-06-08',
        courtsRequested: 1,
        available: true,
        slots: [slot([3])],
        alternativeDays: [],
      });
      fixture.detectChanges();

      (fixture.nativeElement.querySelector('[data-testid="book-slot"]') as HTMLElement).click();

      expect(book).toHaveBeenCalledWith('2026-06-08', slot([3]));
    });
  });
});

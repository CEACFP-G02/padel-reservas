import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import {
  Booking,
  BookingFilters,
  BookingStatus,
  Court,
  CourtDayAvailability,
  CourtType,
} from '../../../shared/models';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm.dialog';
import { bookingFixture } from '../../../testing/fixtures';
import { BookingError, BookingFacade } from '../../booking/booking.facade';
import { CourtFacade } from '../../court/court.facade';
import { AvailabilityFacade } from '../availability.facade';
import { ManualBookingDialog } from '../../booking/pages/manual-booking.dialog';
import { AvailabilityPage } from './availability.page';

describe('AvailabilityPage', () => {
  const courts: Court[] = [
    { id: 3, name: 'Pista 3', type: CourtType.GLASS, indoor: true, active: true },
    { id: 4, name: 'Pista 4', type: CourtType.WALL, indoor: false, active: false },
  ];
  const day: CourtDayAvailability = {
    courtId: 3,
    courtName: 'Pista 3',
    date: '2026-06-08',
    slots: [
      { start: '07:00', end: '08:00', available: false },
      { start: '08:00', end: '09:00', available: false },
      { start: '09:00', end: '10:00', available: true },
      { start: '10:00', end: '11:00', available: false },
    ],
  };
  const booking: Booking = {
    ...bookingFixture,
    courtName: 'Pista 3',
    totalPrice: 34,
    slots: [
      { start: '07:00', end: '08:00', price: 16 },
      { start: '08:00', end: '09:00', price: 18 },
    ],
  };

  let availability: {
    dayAvailability: ReturnType<typeof signal<CourtDayAvailability | null>>;
    occupancy: ReturnType<typeof signal<number>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    getCourtDayAvailability: ReturnType<typeof vi.fn>;
  };
  let bookings: {
    bookings: ReturnType<typeof signal<Booking[]>>;
    filters: ReturnType<typeof signal<BookingFilters>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    listBookings: ReturnType<typeof vi.fn>;
    cancelBooking: ReturnType<typeof vi.fn>;
  };
  let courtFacade: {
    courts: ReturnType<typeof signal<Court[]>>;
    listCourts: ReturnType<typeof vi.fn>;
  };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<AvailabilityPage>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 5, 8, 12, 0));
  });

  afterEach(() => vi.useRealTimers());

  function render(grid: CourtDayAvailability | null = day, dayBookings: Booking[] = [booking]) {
    availability = {
      dayAvailability: signal(grid),
      occupancy: signal(0.75),
      loading: signal(false),
      error: signal<string | null>(null),
      getCourtDayAvailability: vi.fn().mockResolvedValue(undefined),
    };
    bookings = {
      bookings: signal(dayBookings),
      filters: signal<BookingFilters>({}),
      loading: signal(false),
      error: signal<string | null>(null),
      listBookings: vi.fn().mockResolvedValue(undefined),
      cancelBooking: vi.fn().mockResolvedValue(undefined),
    };
    courtFacade = { courts: signal(courts), listCourts: vi.fn().mockResolvedValue(undefined) };
    dialog = { open: vi.fn() };
    snackBar = { open: vi.fn() };
    TestBed.configureTestingModule({
      imports: [AvailabilityPage],
      providers: [
        provideNativeDateAdapter(),
        { provide: AvailabilityFacade, useValue: availability },
        { provide: BookingFacade, useValue: bookings },
        { provide: CourtFacade, useValue: courtFacade },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    fixture = TestBed.createComponent(AvailabilityPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const cells = (element: HTMLElement) =>
    [...element.querySelectorAll('[data-testid="slot"]')].map((cell) =>
      [...cell.children].map((part) => part.textContent?.trim()).join(' '),
    );
  const cell = (element: HTMLElement, index: number) =>
    element.querySelectorAll('[data-testid="slot"]')[index];
  const click = (element: Element | null | undefined) => (element as HTMLElement).click();
  const dialogClosingWith = (value: unknown) =>
    dialog.open.mockReturnValueOnce({ afterClosed: () => of(value) });
  const flush = () => new Promise((resolve) => setTimeout(resolve));

  it('lists every court (history included) and loads the first one for today', () => {
    render();

    expect(courtFacade.listCourts).toHaveBeenCalledWith({ size: 100 });
    expect(availability.getCourtDayAvailability).toHaveBeenCalledWith(3, '2026-06-08');
    expect(bookings.listBookings).toHaveBeenCalledWith({
      date: '2026-06-08',
      courtId: 3,
      size: 100,
    });
  });

  it('renders the grid as free / taken, with the booking of each booked slot', () => {
    const element = render();

    expect(element.querySelector('h1')?.textContent).toContain('Ocupación');
    expect(element.querySelector('[data-testid="occupancy"]')?.textContent).toContain('75%');
    expect(cells(element)).toEqual([
      '07:00 – 08:00 Reservada Demo Client Reserva 07:00 – 09:00 · €16.00 Cancelar reserva',
      '08:00 – 09:00 Reservada Demo Client Reserva 07:00 – 09:00 · €18.00 Cancelar reserva',
      '09:00 – 10:00 Libre Reservar',
      '10:00 – 11:00 No disponible',
    ]);
    expect(cell(element, 0).classList).toContain('booked');
    expect(cell(element, 2).classList).toContain('free');
    expect(cell(element, 3).classList).toContain('unavailable');
  });

  it('does not offer cancelling a booking that is no longer CONFIRMED', () => {
    const element = render(day, [{ ...booking, status: BookingStatus.COMPLETED }]);

    expect(cell(element, 0).textContent).toContain('Demo Client');
    expect(element.querySelector('[data-testid="cancel-booking"]')).toBeNull();
  });

  it('reloads when another court is picked', async () => {
    const element = render();
    availability.getCourtDayAvailability.mockClear();
    bookings.listBookings.mockClear();

    click(element.querySelector('mat-select [role="combobox"], .mat-mdc-select-trigger'));
    fixture.detectChanges();
    const option = [...document.querySelectorAll('mat-option')].find((o) =>
      o.textContent?.includes('Pista 4'),
    );
    expect(option?.textContent).toContain('(inactiva)');
    click(option);
    fixture.detectChanges();

    expect(availability.getCourtDayAvailability).toHaveBeenCalledWith(4, '2026-06-08');
    expect(bookings.listBookings).toHaveBeenCalledWith({
      date: '2026-06-08',
      courtId: 4,
      size: 100,
    });
  });

  it('reloads when another day is picked, past days included', () => {
    const element = render();
    availability.getCourtDayAvailability.mockClear();

    const third = [...element.querySelectorAll('.mat-calendar-body-cell')].find(
      (c) => c.textContent?.trim() === '3',
    );
    click(third);
    fixture.detectChanges();

    expect(availability.getCourtDayAvailability).toHaveBeenCalledWith(3, '2026-06-03');
    expect(bookings.listBookings).toHaveBeenCalledWith({
      date: '2026-06-03',
      courtId: 3,
      size: 100,
    });
  });

  it('says when the court is closed that day', () => {
    const element = render({ ...day, slots: [] }, []);

    expect(element.textContent).toContain('La pista no abre este día o no tiene horario.');
    expect(cells(element)).toEqual([]);
  });

  it('shows load errors', () => {
    const element = render(null, []);
    availability.error.set('No se pudo cargar la ocupación.');
    bookings.error.set('No se pudieron cargar las reservas.');
    fixture.detectChanges();

    const errors = element.querySelector('[data-testid="load-error"]')?.textContent;
    expect(errors).toContain('No se pudo cargar la ocupación.');
    expect(errors).toContain('No se pudieron cargar las reservas.');
  });

  it('shows a prompt when there are no courts', () => {
    const element = render(null, []);
    courtFacade.courts.set([]);
    fixture.detectChanges();

    expect(element.textContent).toContain('Todavía no hay pistas.');
  });

  describe('manual booking', () => {
    it('opens the booking dialog for a free slot, then confirms and refreshes the grid', async () => {
      const element = render();
      dialogClosingWith({ ...booking, userName: 'Carla Ruiz' });
      availability.getCourtDayAvailability.mockClear();
      bookings.listBookings.mockClear();

      click(cell(element, 2).querySelector('[data-testid="book-slot"]'));
      await flush();

      expect(dialog.open).toHaveBeenCalledWith(
        ManualBookingDialog,
        expect.objectContaining({
          data: {
            courtId: 3,
            courtName: 'Pista 3',
            date: '2026-06-08',
            start: '09:00',
            end: '10:00',
          },
        }),
      );
      expect(snackBar.open).toHaveBeenCalledWith(
        'Reserva creada para Carla Ruiz.',
        'OK',
        expect.anything(),
      );
      expect(availability.getCourtDayAvailability).toHaveBeenCalledWith(3, '2026-06-08');
      expect(bookings.listBookings).toHaveBeenCalledWith({
        date: '2026-06-08',
        courtId: 3,
        size: 100,
      });
    });

    it('only free slots can be booked', () => {
      const element = render();

      expect(cell(element, 0).querySelector('[data-testid="book-slot"]')).toBeNull();
      expect(cell(element, 3).querySelector('[data-testid="book-slot"]')).toBeNull();
    });

    it('does nothing when the dialog is cancelled', async () => {
      const element = render();
      dialogClosingWith(undefined);
      availability.getCourtDayAvailability.mockClear();

      click(cell(element, 2).querySelector('[data-testid="book-slot"]'));
      await flush();

      expect(snackBar.open).not.toHaveBeenCalled();
      expect(availability.getCourtDayAvailability).not.toHaveBeenCalled();
    });
  });

  describe('cancel flow', () => {
    it('cancels the booking only after confirming, then refreshes the grid', async () => {
      const element = render();
      dialogClosingWith(true);
      availability.getCourtDayAvailability.mockClear();
      bookings.listBookings.mockClear();

      click(cell(element, 1).querySelector('[data-testid="cancel-booking"]'));
      await flush();

      expect(dialog.open).toHaveBeenCalledWith(
        ConfirmDialog,
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Cancelar reserva',
            message: expect.stringContaining('Demo Client'),
            confirmLabel: 'Cancelar reserva',
          }),
        }),
      );
      expect(bookings.cancelBooking).toHaveBeenCalledWith(5001);
      expect(snackBar.open).toHaveBeenCalledWith('Reserva cancelada.', 'OK', expect.anything());
      expect(availability.getCourtDayAvailability).toHaveBeenCalledWith(3, '2026-06-08');
      expect(bookings.listBookings).toHaveBeenCalledWith({
        date: '2026-06-08',
        courtId: 3,
        size: 100,
      });
    });

    it('does nothing when the confirmation is dismissed', async () => {
      const element = render();
      dialogClosingWith(false);
      availability.getCourtDayAvailability.mockClear();

      click(cell(element, 0).querySelector('[data-testid="cancel-booking"]'));
      await flush();

      expect(bookings.cancelBooking).not.toHaveBeenCalled();
      expect(availability.getCourtDayAvailability).not.toHaveBeenCalled();
    });

    it('shows the cancel error and still refreshes the grid', async () => {
      const element = render();
      dialogClosingWith(true);
      bookings.cancelBooking.mockRejectedValueOnce(
        new BookingError('La reserva ya no está confirmada; no se puede cancelar.'),
      );
      availability.getCourtDayAvailability.mockClear();

      click(cell(element, 0).querySelector('[data-testid="cancel-booking"]'));
      await flush();

      expect(snackBar.open).toHaveBeenCalledWith(
        'La reserva ya no está confirmada; no se puede cancelar.',
        'OK',
        expect.anything(),
      );
      expect(availability.getCourtDayAvailability).toHaveBeenCalledWith(3, '2026-06-08');
    });
  });
});

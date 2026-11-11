import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { provideSpanishLocale } from '../../../core/locale/spanish-locale';
import { Booking, BookingStatus, Client, PageMeta } from '../../../shared/models';
import { bookingFixture } from '../../../testing/fixtures';
import { UserFacade } from '../user.facade';
import { ClientDetailPage } from './client-detail.page';

describe('ClientDetailPage', () => {
  const ana: Client = {
    id: 42,
    name: 'Ana López',
    email: 'ana@padel.test',
    phone: null,
    active: false,
  };
  const twoHours: Booking = {
    ...bookingFixture,
    id: 5002,
    courtName: 'Pista 3',
    date: '2026-06-09',
    status: BookingStatus.CANCELLED,
    totalPrice: 34,
    slots: [
      { start: '18:00', end: '19:00', price: 16 },
      { start: '19:00', end: '20:00', price: 18 },
    ],
  };

  let facade: {
    selected: ReturnType<typeof signal<Client | null>>;
    selectedError: ReturnType<typeof signal<string | null>>;
    clientBookings: ReturnType<typeof signal<Booking[]>>;
    clientBookingsPage: ReturnType<typeof signal<PageMeta | null>>;
    clientBookingsLoading: ReturnType<typeof signal<boolean>>;
    clientBookingsError: ReturnType<typeof signal<string | null>>;
    getClient: ReturnType<typeof vi.fn>;
    listClientBookings: ReturnType<typeof vi.fn>;
  };
  let fixture: ComponentFixture<ClientDetailPage>;

  function render(bookings: Booking[] = [twoHours, bookingFixture]) {
    facade = {
      selected: signal<Client | null>(ana),
      selectedError: signal<string | null>(null),
      clientBookings: signal(bookings),
      clientBookingsPage: signal<PageMeta | null>({
        page: 0,
        size: 10,
        totalElements: bookings.length,
        totalPages: 1,
      }),
      clientBookingsLoading: signal(false),
      clientBookingsError: signal<string | null>(null),
      getClient: vi.fn().mockResolvedValue(undefined),
      listClientBookings: vi.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({
      imports: [ClientDetailPage],
      providers: [
        provideSpanishLocale(),
        provideRouter([]),
        { provide: UserFacade, useValue: facade },
      ],
    });
    fixture = TestBed.createComponent(ClientDetailPage);
    fixture.componentRef.setInput('id', '42');
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const rows = (element: HTMLElement) =>
    [...element.querySelectorAll('[data-testid="booking-row"]')].map((row) =>
      [...row.querySelectorAll('td')].map((cell) => cell.textContent?.trim()),
    );

  it('loads the client and the first page of their bookings', () => {
    render();

    expect(facade.getClient).toHaveBeenCalledWith(42);
    expect(facade.listClientBookings).toHaveBeenCalledWith(42, { size: 10 });
  });

  it('shows the client, including when inactive', () => {
    const element = render();

    expect(element.textContent).toContain('Ana López');
    expect(element.textContent).toContain('ana@padel.test · sin teléfono');
    expect(element.querySelector('[data-testid="client-inactive"]')?.textContent?.trim()).toBe(
      'Dado de baja',
    );
  });

  it('lists court, date, time, price and status of each booking in Spanish', () => {
    const element = render();

    expect(rows(element)).toEqual([
      ['Pista 3', '9 jun 2026', '18:00 – 20:00', '34,00 €', 'Cancelada'],
      ['Court 3', '8 jun 2026', '07:00 – 08:00', '16,00 €', 'Confirmada'],
    ]);
    expect(element.querySelector('[data-testid="booking-row"] a')?.getAttribute('href')).toBe(
      '/bookings/5002',
    );
  });

  it('pages through the bookings', () => {
    render();

    fixture.componentInstance['changePage']({ pageIndex: 1, pageSize: 20, length: 30 });

    expect(facade.listClientBookings).toHaveBeenLastCalledWith(42, { page: 1, size: 20 });
  });

  it('shows a loading state and an empty state', () => {
    const element = render([]);
    facade.clientBookingsLoading.set(true);
    fixture.detectChanges();
    expect(element.querySelector('mat-progress-bar')).not.toBeNull();
    expect(element.textContent).toContain('Cargando reservas…');

    facade.clientBookingsLoading.set(false);
    fixture.detectChanges();
    expect(element.textContent).toContain('Este cliente todavía no tiene reservas.');
  });

  it('shows the bookings error', () => {
    const element = render([]);
    facade.clientBookingsError.set('No se pudieron cargar las reservas del cliente.');
    fixture.detectChanges();

    expect(element.querySelector('[data-testid="bookings-error"]')?.textContent?.trim()).toBe(
      'No se pudieron cargar las reservas del cliente.',
    );
  });

  it('shows the error when the client cannot be loaded', () => {
    const element = render([]);
    facade.selected.set(null);
    facade.selectedError.set('Ese cliente no existe.');
    fixture.detectChanges();

    expect(element.querySelector('[data-testid="client-error"]')?.textContent?.trim()).toBe(
      'Ese cliente no existe.',
    );
    expect(element.textContent).not.toContain('Cargando cliente');
  });
});

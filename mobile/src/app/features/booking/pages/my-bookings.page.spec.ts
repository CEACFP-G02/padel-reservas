import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';

import { Booking, BookingStatus } from '../../../shared/models';
import { bookingFixture } from '../../../testing/fixtures';
import { textOf } from '../../../testing/text';
import { BookingFacade } from '../booking.facade';
import { MyBookingsPage } from './my-bookings.page';

describe('MyBookingsPage', () => {
  let getMyBookings: ReturnType<typeof vi.fn>;
  let myBookings: ReturnType<typeof signal<Booking[]>>;
  let error: ReturnType<typeof signal<string | null>>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 5, 8, 12, 0));
    getMyBookings = vi.fn().mockResolvedValue(undefined);
    myBookings = signal<Booking[]>([]);
    error = signal<string | null>(null);
  });

  afterEach(() => vi.useRealTimers());

  function render() {
    TestBed.configureTestingModule({
      imports: [MyBookingsPage],
      providers: [
        provideRouter([]),
        provideIonicAngular(),
        { provide: BookingFacade, useValue: { myBookings, error, loading: signal(false), getMyBookings } },
      ],
    });
    const fixture = TestBed.createComponent(MyBookingsPage);
    fixture.detectChanges();
    return fixture;
  }

  const rows = (element: HTMLElement, section: string) =>
    [...element.querySelectorAll(`[data-testid="${section}"] [data-testid="booking"]`)].map(textOf);

  it('loads the bookings each time the tab is shown', () => {
    const fixture = render();

    fixture.componentInstance.ionViewWillEnter();
    fixture.componentInstance.ionViewWillEnter();

    expect(getMyBookings).toHaveBeenCalledTimes(2);
    expect(getMyBookings).toHaveBeenCalledWith({ size: 100 });
  });

  it('lists upcoming and past bookings with court, date, time, price and status', () => {
    myBookings.set([
      bookingFixture({ id: 1, date: '2026-06-07', courtName: 'Pista 1', status: BookingStatus.COMPLETED }),
      bookingFixture({
        id: 2,
        date: '2026-06-09',
        courtName: 'Pista 3',
        totalPrice: 34,
        slots: [
          { start: '18:00', end: '19:00', price: 16 },
          { start: '19:00', end: '20:00', price: 18 },
        ],
      }),
      bookingFixture({ id: 3, date: '2026-06-10', courtName: 'Pista 2', status: BookingStatus.CANCELLED }),
    ]);
    const fixture = render();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Próximas');
    expect(element.textContent).toContain('Historial');
    expect(rows(element, 'upcoming')).toEqual(['Pista 3 martes, 9 de junio · 18:00 – 20:00 34,00 € Confirmada']);
    expect(rows(element, 'past')).toEqual([
      'Pista 2 miércoles, 10 de junio · 07:00 – 08:00 16,00 € Cancelada',
      'Pista 1 domingo, 7 de junio · 07:00 – 08:00 16,00 € Completada',
    ]);
    const link = element.querySelector('[data-testid="upcoming"] [data-testid="booking"]');
    expect(link?.getAttribute('href')).toBe('/2');
  });

  it('says when there are no upcoming bookings, and hides an empty history', () => {
    myBookings.set([]);
    const element = render().nativeElement as HTMLElement;

    expect(element.textContent).toContain('No tienes reservas próximas.');
    expect(element.querySelector('[data-testid="past"]')).toBeNull();
  });

  it('shows the load error', () => {
    error.set('No se pudieron cargar tus reservas.');
    const element = render().nativeElement as HTMLElement;

    expect(element.textContent).toContain('No se pudieron cargar tus reservas.');
  });
});

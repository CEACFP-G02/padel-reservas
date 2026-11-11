import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AlertController, provideIonicAngular, ToastController } from '@ionic/angular';

import { Booking, BookingStatus } from '../../../shared/models';
import { bookingFixture } from '../../../testing/fixtures';
import { textOf } from '../../../testing/text';
import { BookingFacade } from '../booking.facade';
import { BookingDetailPage } from './booking-detail.page';

describe('BookingDetailPage', () => {
  const booking = bookingFixture({
    date: '2026-06-09',
    courtName: 'Pista 3',
    totalPrice: 34,
    slots: [
      { start: '18:00', end: '19:00', price: 16 },
      { start: '19:00', end: '20:00', price: 18 },
    ],
  });

  let facade: {
    selected: ReturnType<typeof signal<Booking | null>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    getBooking: ReturnType<typeof vi.fn>;
    getMyBookings: ReturnType<typeof vi.fn>;
    cancelBooking: ReturnType<typeof vi.fn>;
  };
  let alertCreate: ReturnType<typeof vi.fn>;
  let toastCreate: ReturnType<typeof vi.fn>;
  let fixture: ComponentFixture<BookingDetailPage>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 5, 8, 12, 0));
    facade = {
      selected: signal<Booking | null>(booking),
      loading: signal(false),
      error: signal<string | null>(null),
      getBooking: vi.fn().mockResolvedValue(undefined),
      getMyBookings: vi.fn().mockResolvedValue(undefined),
      cancelBooking: vi.fn().mockResolvedValue(true),
    };
    alertCreate = vi.fn();
    toastCreate = vi.fn().mockResolvedValue({ present: vi.fn() });
  });

  afterEach(() => vi.useRealTimers());

  function render() {
    TestBed.configureTestingModule({
      imports: [BookingDetailPage],
      providers: [
        provideRouter([]),
        provideIonicAngular(),
        { provide: BookingFacade, useValue: facade },
        { provide: AlertController, useValue: { create: alertCreate } },
        { provide: ToastController, useValue: { create: toastCreate } },
      ],
    });
    fixture = TestBed.createComponent(BookingDetailPage);
    fixture.componentRef.setInput('id', '5001');
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function alertDismissesWith(role: string): void {
    alertCreate.mockResolvedValue({ present: vi.fn(), onDidDismiss: vi.fn().mockResolvedValue({ role }) });
  }

  const cancelButton = (element: HTMLElement) => element.querySelector('[data-testid="cancel"]') as HTMLElement | null;
  const text = textOf;

  it('loads the booking of the route id', () => {
    render();

    expect(facade.getBooking).toHaveBeenCalledWith(5001);
  });

  it('shows court, date, time, slot prices, total and status', () => {
    const element = render();

    expect(text(element)).toContain('Pista 3');
    expect(text(element)).toContain('martes, 9 de junio');
    expect(text(element)).toContain('18:00 – 19:00 16,00 €');
    expect(text(element)).toContain('19:00 – 20:00 18,00 €');
    expect(text(element)).toContain('Total 34,00 €');
    expect(text(element)).toContain('Confirmada');
  });

  it('shows the load error', () => {
    facade.selected.set(null);
    facade.error.set('No se encontró la reserva.');
    const element = render();

    expect(text(element)).toContain('No se encontró la reserva.');
  });

  it('offers cancelling only an upcoming CONFIRMED booking', () => {
    facade.selected.set({ ...booking, status: BookingStatus.CANCELLED });
    let element = render();
    expect(cancelButton(element)).toBeNull();

    facade.selected.set({ ...booking, date: '2026-06-07' });
    fixture.detectChanges();
    element = fixture.nativeElement;
    expect(cancelButton(element)).toBeNull();
  });

  describe('cancel flow', () => {
    it('cancels after confirming, then refreshes the list and goes back to it', async () => {
      alertDismissesWith('confirm');
      const element = render();
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

      cancelButton(element)?.click();
      await fixture.whenStable();

      expect(alertCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          header: '¿Cancelar la reserva?',
          message: expect.stringContaining('24 horas'),
        }),
      );
      expect(facade.cancelBooking).toHaveBeenCalledWith(5001);
      expect(toastCreate).toHaveBeenCalledWith(expect.objectContaining({ message: 'Reserva cancelada.', color: 'success' }));
      expect(facade.getMyBookings).toHaveBeenCalledWith({ size: 100 });
      expect(navigate).toHaveBeenCalledWith('/tabs/bookings');
    });

    it('does nothing when the confirmation is dismissed', async () => {
      alertDismissesWith('cancel');
      const element = render();

      cancelButton(element)?.click();
      await fixture.whenStable();

      expect(facade.cancelBooking).not.toHaveBeenCalled();
    });

    it('shows the Spanish message when it is too late to cancel (409) and stays on the booking', async () => {
      alertDismissesWith('confirm');
      facade.cancelBooking.mockImplementation(async () => {
        facade.error.set('Ya no puedes cancelar esta reserva: solo se puede cancelar hasta 24 horas antes de que empiece.');
        return false;
      });
      const element = render();
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');

      cancelButton(element)?.click();
      await fixture.whenStable();

      expect(toastCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Ya no puedes cancelar esta reserva: solo se puede cancelar hasta 24 horas antes de que empiece.',
          color: 'danger',
        }),
      );
      expect(navigate).not.toHaveBeenCalled();
      expect(facade.getMyBookings).not.toHaveBeenCalled();
    });
  });
});

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ModalController, provideIonicAngular } from '@ionic/angular';

import { Booking, CreateBookingRequest, PaymentMethod, SlotResponse } from '../../../shared/models';
import { bookingFixture } from '../../../testing/fixtures';
import { textOf } from '../../../testing/text';
import { PaymentMethodFacade } from '../../payment-method/payment-method.facade';
import { WalletFacade } from '../../wallet/wallet.facade';
import { BookingFacade } from '../booking.facade';
import { BookingConfirmModal } from './booking-confirm.modal';

describe('BookingConfirmModal', () => {
  type CreateBooking = (request: CreateBookingRequest) => Promise<Booking | null>;
  let createBooking: ReturnType<typeof vi.fn<CreateBooking>>;
  let error: ReturnType<typeof signal<string | null>>;
  let slotTaken: ReturnType<typeof signal<boolean>>;
  let dismiss: ReturnType<typeof vi.fn>;
  let balance: ReturnType<typeof signal<number | null>>;
  let methods: ReturnType<typeof signal<PaymentMethod[]>>;
  let refreshBalance: ReturnType<typeof vi.fn>;
  let listMethods: ReturnType<typeof vi.fn>;
  const visa: PaymentMethod = { id: 7, brand: 'VISA', last4: '4242', expiry: '2028-12', default: true };
  const master: PaymentMethod = { id: 8, brand: 'MASTERCARD', last4: '4444', expiry: '2029-01', default: false };

  function slot(courtIds: number[]): SlotResponse {
    return { start: '07:00', end: '08:00', courtsFree: courtIds.length, courtIds, price: 16 };
  }

  function render(courtIds: number[]) {
    TestBed.configureTestingModule({
      imports: [BookingConfirmModal],
      providers: [
        provideIonicAngular(),
        { provide: BookingFacade, useValue: { createBooking, error, slotTaken, loading: signal(false) } },
        { provide: ModalController, useValue: { dismiss } },
        { provide: WalletFacade, useValue: { balance, refreshBalance } },
        {
          provide: PaymentMethodFacade,
          useValue: { methods, loaded: signal(true), listMethods },
        },
      ],
    });
    const fixture = TestBed.createComponent(BookingConfirmModal);
    fixture.componentRef.setInput('date', '2026-06-08');
    fixture.componentRef.setInput('slot', slot(courtIds));
    fixture.detectChanges();
    return fixture;
  }

  const text = (fixture: { nativeElement: HTMLElement }) => fixture.nativeElement.textContent ?? '';
  const click = (fixture: { nativeElement: HTMLElement }, testId: string) =>
    (fixture.nativeElement.querySelector(`[data-testid="${testId}"]`) as HTMLElement).click();

  beforeEach(() => {
    createBooking = vi.fn<CreateBooking>().mockResolvedValue(bookingFixture());
    error = signal<string | null>(null);
    slotTaken = signal(false);
    dismiss = vi.fn().mockResolvedValue(true);
    balance = signal<number | null>(3);
    methods = signal<PaymentMethod[]>([visa, master]);
    refreshBalance = vi.fn().mockResolvedValue(undefined);
    listMethods = vi.fn().mockResolvedValue(undefined);
  });

  it('shows the date, time, court and price to confirm', () => {
    const fixture = render([3]);

    expect(text(fixture)).toContain('Confirmar reserva');
    expect(text(fixture)).toContain('lunes, 8 de junio');
    expect(text(fixture)).toContain('07:00 – 08:00');
    expect(text(fixture)).toContain('Pista 3');
    expect(text(fixture)).toContain('16,00\u00a0€');
  });

  it('books the only free court and closes with the booking', async () => {
    const fixture = render([3]);

    click(fixture, 'confirm-booking');
    await fixture.whenStable();

    expect(createBooking).toHaveBeenCalledWith({ courtId: 3, date: '2026-06-08', slots: [{ start: '07:00', end: '08:00' }] });
    expect(dismiss).toHaveBeenCalledWith(bookingFixture(), 'booked');
  });

  it('lets the client choose among several free courts and books the chosen one', async () => {
    const fixture = render([1, 3]);
    const options = Array.from(fixture.nativeElement.querySelectorAll('[data-testid="court-option"]')) as HTMLElement[];
    expect(options.map((o) => o.textContent?.trim())).toEqual(['Pista 1', 'Pista 3']);

    fixture.componentInstance['courtId'].set(3);
    fixture.detectChanges();
    click(fixture, 'confirm-booking');
    await fixture.whenStable();

    expect(createBooking).toHaveBeenCalledWith(expect.objectContaining({ courtId: 3 }));
  });

  it('defaults to the first free court', async () => {
    const fixture = render([1, 3]);

    click(fixture, 'confirm-booking');
    await fixture.whenStable();

    expect(createBooking).toHaveBeenCalledWith(expect.objectContaining({ courtId: 1 }));
  });

  it('closes as taken when the slot was just booked by someone else (409)', async () => {
    createBooking.mockImplementation(async () => {
      error.set('Ese turno ya no está libre en esa pista. Vuelve a buscar.');
      slotTaken.set(true);
      return null;
    });
    const fixture = render([3]);

    click(fixture, 'confirm-booking');
    await fixture.whenStable();

    expect(dismiss).toHaveBeenCalledWith(null, 'taken');
  });

  it('stays open showing the API error for any other failure', async () => {
    createBooking.mockImplementation(async () => {
      error.set('No se pudo crear la reserva.');
      return null;
    });
    const fixture = render([3]);

    click(fixture, 'confirm-booking');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(dismiss).not.toHaveBeenCalled();
    expect(text(fixture)).toContain('No se pudo crear la reserva.');
  });

  it('can be cancelled without booking', () => {
    const fixture = render([3]);

    click(fixture, 'cancel-booking');

    expect(createBooking).not.toHaveBeenCalled();
    expect(dismiss).toHaveBeenCalledWith(null, 'cancel');
  });

  describe('paying credit first, then a card', () => {
    const split = (fixture: { nativeElement: HTMLElement }) =>
      textOf(fixture.nativeElement.querySelector('[data-testid="payment-split"]'));
    const cardOptions = (fixture: { nativeElement: HTMLElement }) =>
      (Array.from(fixture.nativeElement.querySelectorAll('[data-testid="card-option"]')) as HTMLElement[]).map((o) =>
        textOf(o),
      );

    it('loads the balance and the cards when it opens', () => {
      render([3]);

      expect(refreshBalance).toHaveBeenCalled();
      expect(listMethods).toHaveBeenCalled();
    });

    it('fully by credit: shows 1 credit and nothing to charge, needs no card and sends none', async () => {
      const fixture = render([3]);

      expect(split(fixture)).toBe('Créditos usados 1 Importe a cobrar 0,00 €');
      expect(cardOptions(fixture)).toEqual([]);

      click(fixture, 'confirm-booking');
      await fixture.whenStable();

      expect(createBooking).toHaveBeenCalledWith({ courtId: 3, date: '2026-06-08', slots: [{ start: '07:00', end: '08:00' }] });
      expect(refreshBalance).toHaveBeenCalledTimes(2);
      expect(dismiss).toHaveBeenCalledWith(bookingFixture(), 'booked');
    });

    it('without credit: shows the amount, preselects the default card and sends it', async () => {
      balance.set(0);
      const fixture = render([3]);

      expect(split(fixture)).toBe('Créditos usados 0 Importe a cobrar 16,00 €');
      expect(cardOptions(fixture)).toEqual(['VISA •••• 4242 Predeterminada', 'MASTERCARD •••• 4444']);

      click(fixture, 'confirm-booking');
      await fixture.whenStable();

      expect(createBooking).toHaveBeenCalledWith(expect.objectContaining({ paymentMethodId: 7 }));
    });

    it('without credit: books with the card the client picks', async () => {
      balance.set(0);
      const fixture = render([3]);

      fixture.componentInstance['cardId'].set(8);
      fixture.detectChanges();
      click(fixture, 'confirm-booking');
      await fixture.whenStable();

      expect(createBooking).toHaveBeenCalledWith(expect.objectContaining({ paymentMethodId: 8 }));
    });

    it('without credit and without cards: asks to add one in Monedero and cannot book', () => {
      balance.set(0);
      methods.set([]);
      const fixture = render([3]);

      expect(text(fixture)).toContain('Añade una tarjeta en Monedero para pagar el importe.');
      expect(fixture.nativeElement.querySelector('[data-testid="confirm-booking"]').disabled).toBe(true);
    });

    it('cannot book until the balance is known', () => {
      balance.set(null);
      const fixture = render([3]);

      expect(fixture.nativeElement.querySelector('[data-testid="confirm-booking"]').disabled).toBe(true);
    });

    it('a declined card stays open with "Pago rechazado" so another card can be tried', async () => {
      balance.set(0);
      createBooking.mockImplementation(async () => {
        error.set('Pago rechazado: la reserva no se ha hecho. Prueba con otra tarjeta.');
        return null;
      });
      const fixture = render([3]);

      click(fixture, 'confirm-booking');
      await fixture.whenStable();
      fixture.detectChanges();

      expect(dismiss).not.toHaveBeenCalled();
      expect(text(fixture)).toContain('Pago rechazado: la reserva no se ha hecho. Prueba con otra tarjeta.');
    });

    it('a slot taken meanwhile closes as taken, with nothing charged', async () => {
      balance.set(0);
      createBooking.mockImplementation(async () => {
        slotTaken.set(true);
        return null;
      });
      const fixture = render([3]);

      click(fixture, 'confirm-booking');
      await fixture.whenStable();

      expect(dismiss).toHaveBeenCalledWith(null, 'taken');
    });
  });
});

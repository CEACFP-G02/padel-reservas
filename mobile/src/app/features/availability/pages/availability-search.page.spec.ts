import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ModalController, provideIonicAngular, ToastController } from '@ionic/angular';

import { AvailabilityQuery, AvailabilityResponse, SlotResponse } from '../../../shared/models';
import { toIsoDate } from '../../../shared/util/date';
import { bookingFixture } from '../../../testing/fixtures';
import { BookingConfirmModal } from '../../booking/components/booking-confirm.modal';
import { BookingFacade } from '../../booking/booking.facade';
import { AvailabilityFacade } from '../availability.facade';
import { AvailabilitySearchPage } from './availability-search.page';

describe('AvailabilitySearchPage', () => {
  const today = toIsoDate(new Date());
  const inDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return toIsoDate(d);
  };

  const result = signal<AvailabilityResponse | null>(null);
  const getAvailability = vi.fn<(query: AvailabilityQuery) => Promise<void>>().mockResolvedValue();
  const refresh = vi.fn<() => Promise<void>>().mockResolvedValue();
  const facade = {
    query: signal<AvailabilityQuery | null>(null),
    result,
    loading: signal(false),
    error: signal<string | null>(null),
    showAlternatives: computed(() => result()?.available === false),
    getAvailability,
    refresh,
  };

  type Dismiss = { role?: string; data?: unknown };
  let modalCreate: ReturnType<typeof vi.fn>;
  let toastCreate: ReturnType<typeof vi.fn>;
  let bookingError: ReturnType<typeof signal<string | null>>;

  function modalDismissesWith(dismiss: Dismiss): void {
    modalCreate.mockResolvedValue({ present: vi.fn(), onDidDismiss: vi.fn().mockResolvedValue(dismiss) });
  }

  function slot(courtIds: number[], start = '07:00', end = '08:00'): SlotResponse {
    return { start, end, courtsFree: courtIds.length, courtIds, price: 16 };
  }

  function render() {
    TestBed.configureTestingModule({
      imports: [AvailabilitySearchPage],
      providers: [
        provideRouter([]),
        provideIonicAngular(),
        { provide: AvailabilityFacade, useValue: facade },
        { provide: BookingFacade, useValue: { error: bookingError } },
        { provide: ModalController, useValue: { create: modalCreate } },
        { provide: ToastController, useValue: { create: toastCreate } },
      ],
    });
    const fixture = TestBed.createComponent(AvailabilitySearchPage);
    fixture.detectChanges();
    return fixture;
  }

  const text = (fixture: { nativeElement: HTMLElement }) => (fixture.nativeElement.textContent ?? '') as string;

  beforeEach(() => {
    result.set(null);
    getAvailability.mockClear();
    refresh.mockClear();
    modalCreate = vi.fn();
    toastCreate = vi.fn().mockResolvedValue({ present: vi.fn() });
    bookingError = signal<string | null>(null);
  });

  describe('search', () => {
    it('searches today for one court by default', () => {
      const fixture = render();
      (fixture.nativeElement.querySelector('[data-testid="search"]') as HTMLElement).click();
      expect(getAvailability).toHaveBeenCalledWith({ date: today, courts: 1 });
    });

    it('searches with the chosen date and number of courts', () => {
      const page = render().componentInstance;
      page['date'].set('2026-06-08');
      page['courts'].set(2);
      page['search']();
      expect(getAvailability).toHaveBeenCalledWith({ date: '2026-06-08', courts: 2 });
    });

    it('offers 1 to 4 courts', () => {
      expect(render().componentInstance['courtOptions']).toEqual([1, 2, 3, 4]);
    });
  });

  describe('results', () => {
    it('lists each matching slot with its time, free courts and price', () => {
      const fixture = render();
      result.set({
        requestedDate: '2026-06-08',
        courtsRequested: 2,
        available: true,
        slots: [slot([1, 2, 3]), slot([2, 4], '08:00', '09:00')],
        alternativeDays: [],
      });
      fixture.detectChanges();

      const slots = Array.from(fixture.nativeElement.querySelectorAll('[data-testid="slot"]')) as HTMLElement[];
      expect(slots).toHaveLength(2);
      expect(slots[0].textContent).toContain('07:00 – 08:00');
      expect(slots[0].textContent).toContain('Pistas 1, 2, 3');
      expect(slots[0].textContent).toContain('16,00\u00a0€');
      expect(slots[1].textContent).toContain('Pistas 2, 4');
      expect(text(fixture)).not.toContain('Días cercanos');
    });

    it('offers the nearby days as chips when the day is full, and searches one when tapped', () => {
      const fixture = render();
      fixture.componentInstance['courts'].set(2);
      result.set({
        requestedDate: inDays(1),
        courtsRequested: 2,
        available: false,
        slots: [],
        alternativeDays: [
          { date: inDays(2), freeSlotCount: 5 },
          { date: inDays(3), freeSlotCount: 1 },
        ],
      });
      fixture.detectChanges();

      expect(text(fixture)).toContain('No hay 2 pistas libres a la vez ese día');
      const chips = Array.from(fixture.nativeElement.querySelectorAll('[data-testid="alternative-day"]')) as HTMLElement[];
      expect(chips.map((c) => c.tagName.toLowerCase())).toEqual(['ion-chip', 'ion-chip']);
      expect(chips[0].textContent).toContain('5 turnos');
      expect(chips[1].textContent).toContain('1 turno');

      chips[1].click();

      expect(fixture.componentInstance['date']()).toBe(inDays(3));
      expect(getAvailability).toHaveBeenLastCalledWith({ date: inDays(3), courts: 2 });
    });

    it('never shows a past day as an alternative', () => {
      const fixture = render();
      result.set({
        requestedDate: today,
        courtsRequested: 1,
        available: false,
        slots: [],
        alternativeDays: [
          { date: inDays(-1), freeSlotCount: 3 },
          { date: today, freeSlotCount: 2 },
          { date: inDays(1), freeSlotCount: 4 },
        ],
      });
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('[data-testid="alternative-day"]')).toHaveLength(2);
    });

    it('says so when no nearby day has room either', () => {
      const fixture = render();
      result.set({ requestedDate: today, courtsRequested: 4, available: false, slots: [], alternativeDays: [] });
      fixture.detectChanges();

      expect(text(fixture)).toContain('Tampoco hay hueco en los días cercanos.');
    });
  });

  describe('booking a slot', () => {
    it('tapping a slot opens the confirmation modal for that date and slot', async () => {
      modalDismissesWith({ role: 'cancel' });
      const fixture = render();
      result.set({ requestedDate: '2026-06-08', courtsRequested: 1, available: true, slots: [slot([3])], alternativeDays: [] });
      fixture.detectChanges();

      (fixture.nativeElement.querySelector('[data-testid="slot"]') as HTMLElement).click();
      await fixture.whenStable();

      expect(modalCreate).toHaveBeenCalledWith(
        expect.objectContaining({ component: BookingConfirmModal, componentProps: { date: '2026-06-08', slot: slot([3]) } }),
      );
    });

    it('confirms a successful booking and refreshes the free slots', async () => {
      modalDismissesWith({ role: 'booked', data: bookingFixture() });
      const page = render().componentInstance;

      await page['book']('2026-06-08', slot([3]));

      expect(toastCreate).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Reserva confirmada: Court 3, lunes, 8 de junio a las 07:00', color: 'success' }),
      );
      expect(refresh).toHaveBeenCalled();
    });

    it('shows the conflict and refreshes the results when the slot was just taken (409)', async () => {
      bookingError.set('Ese turno ya no está libre en esa pista. Vuelve a buscar.');
      modalDismissesWith({ role: 'taken' });
      const page = render().componentInstance;

      await page['book']('2026-06-08', slot([3]));

      expect(toastCreate).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Ese turno ya no está libre en esa pista. Vuelve a buscar.', color: 'danger' }),
      );
      expect(refresh).toHaveBeenCalled();
    });

    it('does nothing when the modal is cancelled', async () => {
      modalDismissesWith({ role: 'cancel' });
      const page = render().componentInstance;

      await page['book']('2026-06-08', slot([3]));

      expect(toastCreate).not.toHaveBeenCalled();
      expect(refresh).not.toHaveBeenCalled();
    });
  });
});

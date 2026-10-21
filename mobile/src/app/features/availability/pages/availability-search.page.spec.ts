import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';

import { AvailabilityQuery, AvailabilityResponse } from '../../../shared/models';
import { toIsoDate } from '../../../shared/util/date';
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

  function render() {
    TestBed.configureTestingModule({
      imports: [AvailabilitySearchPage],
      providers: [
        provideRouter([]),
        provideIonicAngular(),
        { provide: AvailabilityFacade, useValue: facade },
        { provide: BookingFacade, useValue: { createBooking: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(AvailabilitySearchPage);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    result.set(null);
    getAvailability.mockClear();
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
      slots: [{ start: '07:00', end: '08:00', courtsFree: 3, price: 16 }],
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
});

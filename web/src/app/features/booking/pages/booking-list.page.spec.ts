import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter } from '@angular/router';

import { Booking, BookingFilters, PageMeta } from '../../../shared/models';
import { bookingFixture } from '../../../testing/fixtures';
import { BookingFacade } from '../booking.facade';
import { BookingListPage } from './booking-list.page';

describe('BookingListPage', () => {
  function render(bookings: Booking[]) {
    TestBed.configureTestingModule({
      imports: [BookingListPage],
      providers: [
        provideRouter([]),
        provideNativeDateAdapter(),
        {
          provide: BookingFacade,
          useValue: {
            bookings: signal(bookings),
            page: signal<PageMeta | null>(null),
            filters: signal<BookingFilters>({}),
            loading: signal(false),
            listBookings: vi.fn().mockResolvedValue(undefined),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(BookingListPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the client name, linking to the client', () => {
    const element = render([bookingFixture]);

    const link = element.querySelector('[data-testid="booking-client"]') as HTMLAnchorElement;
    expect(link.textContent?.trim()).toBe('Demo Client');
    expect(link.getAttribute('href')).toBe('/clients/42');
    expect(element.textContent).not.toContain('#42');
  });
});

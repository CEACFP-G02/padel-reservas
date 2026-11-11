import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Booking } from '../../../shared/models';
import { bookingFixture } from '../../../testing/fixtures';
import { BookingFacade } from '../booking.facade';
import { BookingDetailPage } from './booking-detail.page';

describe('BookingDetailPage', () => {
  it('shows the client name, linking to the client', () => {
    TestBed.configureTestingModule({
      imports: [BookingDetailPage],
      providers: [
        provideRouter([]),
        {
          provide: BookingFacade,
          useValue: {
            selected: signal<Booking | null>(bookingFixture),
            getBooking: vi.fn().mockResolvedValue(undefined),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(BookingDetailPage);
    fixture.componentRef.setInput('id', 5001);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    const link = element.querySelector('[data-testid="booking-client"]') as HTMLAnchorElement;
    expect(link.textContent?.trim()).toBe('Demo Client');
    expect(link.getAttribute('href')).toBe('/clients/42');
  });
});

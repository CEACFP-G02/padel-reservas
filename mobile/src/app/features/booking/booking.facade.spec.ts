import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BookingFacade } from './booking.facade';

describe('BookingFacade', () => {
  let facade: BookingFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    facade = TestBed.inject(BookingFacade);
  });

  it('starts empty', () => {
    expect(facade.myBookings()).toEqual([]);
    expect(facade.selected()).toBeNull();
    expect(facade.loading()).toBe(false);
  });

  it.todo('createBooking books for the signed-in client');
  it.todo('createBooking reports 409 (slot no longer free) as an error');
  it.todo('getMyBookings loads the client bookings');
  it.todo('getBooking sets the selected (own) booking');
  it.todo('cancelBooking marks the booking CANCELLED');
  it.todo('cancelBooking surfaces the min-notice rejection');
});

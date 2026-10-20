import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { BookingFacade } from './booking.facade';

describe('BookingFacade', () => {
  let facade: BookingFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    facade = TestBed.inject(BookingFacade);
  });

  it('starts with empty state', () => {
    expect(facade.bookings()).toEqual([]);
    expect(facade.selected()).toBeNull();
    expect(facade.filters()).toEqual({});
  });

  it.todo('listBookings loads bookings for the given filters');
  it.todo('getBooking sets the selected booking');
  it.todo('createBooking appends the booking and reports 409 as an error');
  it.todo('cancelBooking marks the booking CANCELLED');
  it.todo('rescheduleBooking replaces date/slots');
});

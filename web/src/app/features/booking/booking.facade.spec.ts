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
    expect(facade.page()).toBeNull();
  });

  it.todo('listBookings loads one page of bookings for the given filters and keeps the page metadata');
  it.todo('getBooking sets the selected booking');
  it.todo('createBooking appends the booking and reports 409 as an error');
  it.todo('cancelBooking (DELETE, 204) marks the booking CANCELLED locally');
  it.todo('rescheduleBooking replaces date/slots');
});

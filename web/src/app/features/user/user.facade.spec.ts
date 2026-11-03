import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { UserFacade } from './user.facade';

describe('UserFacade', () => {
  let facade: UserFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    facade = TestBed.inject(UserFacade);
  });

  it('starts with empty state', () => {
    expect(facade.clients()).toEqual([]);
    expect(facade.selected()).toBeNull();
    expect(facade.page()).toBeNull();
    expect(facade.clientBookings()).toEqual([]);
    expect(facade.clientBookingsPage()).toBeNull();
  });

  it.todo('listClients loads one page of clients (search) and keeps the page metadata');
  it.todo('getClient sets the selected client');
  it.todo('createClient appends the client');
  it.todo('updateClient sends only the changed fields and replaces the client');
  it.todo('deleteClient drops the client');
  it.todo('listClientBookings loads one page of the client bookings');
});

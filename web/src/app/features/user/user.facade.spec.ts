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
  });

  it.todo('listClients loads clients');
  it.todo('getClient sets the selected client');
  it.todo('createClient appends the client');
  it.todo('updateClient replaces the client');
  it.todo('deleteClient drops the client');
});

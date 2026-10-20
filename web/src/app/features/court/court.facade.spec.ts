import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CourtFacade } from './court.facade';

describe('CourtFacade', () => {
  let facade: CourtFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    facade = TestBed.inject(CourtFacade);
  });

  it('starts with empty state', () => {
    expect(facade.courts()).toEqual([]);
    expect(facade.selected()).toBeNull();
    expect(facade.loading()).toBe(false);
  });

  it.todo('listCourts loads courts into the courts signal');
  it.todo('getCourt sets the selected court');
  it.todo('createCourt appends the created court');
  it.todo('updateCourt replaces the court');
  it.todo('deactivateCourt marks the court inactive');
});

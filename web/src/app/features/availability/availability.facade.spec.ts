import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AvailabilityFacade } from './availability.facade';

describe('AvailabilityFacade', () => {
  let facade: AvailabilityFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    facade = TestBed.inject(AvailabilityFacade);
  });

  it('starts with empty state', () => {
    expect(facade.dayAvailability()).toBeNull();
    expect(facade.occupancy()).toBe(0);
  });

  it.todo('getCourtDayAvailability loads the slot grid for court + date');
});

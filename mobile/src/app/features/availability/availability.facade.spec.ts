import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AvailabilityFacade } from './availability.facade';

describe('AvailabilityFacade', () => {
  let facade: AvailabilityFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    facade = TestBed.inject(AvailabilityFacade);
  });

  it('starts with no search', () => {
    expect(facade.query()).toBeNull();
    expect(facade.result()).toBeNull();
    expect(facade.loading()).toBe(false);
    expect(facade.showAlternatives()).toBe(false);
  });

  it.todo('getAvailability stores the query and the response');
  it.todo('getAvailability exposes free slots when available=true');
  it.todo('getAvailability exposes alternativeDays when available=false');
});

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CourtFacade } from './court.facade';

describe('CourtFacade', () => {
  let facade: CourtFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    facade = TestBed.inject(CourtFacade);
  });

  it('starts empty', () => {
    expect(facade.courts()).toEqual([]);
    expect(facade.selected()).toBeNull();
    expect(facade.loading()).toBe(false);
  });

  it.todo('listCourts loads active courts');
  it.todo('getCourt sets the selected court');
});

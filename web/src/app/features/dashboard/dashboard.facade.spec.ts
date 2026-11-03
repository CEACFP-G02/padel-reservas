import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DashboardFacade } from './dashboard.facade';

describe('DashboardFacade', () => {
  let facade: DashboardFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    facade = TestBed.inject(DashboardFacade);
  });

  it('starts with empty state', () => {
    expect(facade.summary()).toBeNull();
    expect(facade.loading()).toBe(false);
  });

  it.todo('getDashboardSummary loads KPIs for the range');
});

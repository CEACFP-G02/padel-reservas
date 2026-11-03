import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ScheduleFacade } from './schedule.facade';

describe('ScheduleFacade', () => {
  let facade: ScheduleFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    facade = TestBed.inject(ScheduleFacade);
  });

  it('starts with empty state', () => {
    expect(facade.schedule()).toBeNull();
    expect(facade.loading()).toBe(false);
  });

  it.todo('getSchedule loads the court schedule');
  it.todo('updateSchedule replaces slotMinutes, price and weekdays');
});

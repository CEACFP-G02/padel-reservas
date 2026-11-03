import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Schedule } from '../../shared/models';
import { API, setUpHttp } from '../../testing/http';
import { ScheduleApi } from './schedule.api';

describe('ScheduleApi', () => {
  const schedule: Schedule = {
    slotMinutes: 60,
    price: 16,
    weekdays: [
      { day: 'MONDAY', open: '08:00', close: '22:00' },
      { day: 'SUNDAY', open: '09:00', close: '14:00' },
    ],
  };
  let api: ScheduleApi;
  let http: HttpTestingController;

  beforeEach(() => {
    http = setUpHttp();
    api = TestBed.inject(ScheduleApi);
  });

  afterEach(() => http.verify());

  it('get GETs /courts/{id}/schedule', () => {
    let result: Schedule | undefined;
    api.get(3).subscribe((s) => (result = s));

    const req = http.expectOne(`${API}/courts/3/schedule`);
    expect(req.request.method).toBe('GET');
    req.flush(schedule);

    expect(result).toEqual(schedule);
  });

  it('update PUTs the full { slotMinutes, price, weekdays } body', () => {
    api.update(3, schedule).subscribe();

    const req = http.expectOne(`${API}/courts/3/schedule`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(schedule);
  });
});

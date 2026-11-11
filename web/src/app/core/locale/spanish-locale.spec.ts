import { CurrencyPipe, DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DateAdapter, provideNativeDateAdapter } from '@angular/material/core';

import { appConfig } from '../../app.config';
import { provideSpanishLocale } from './spanish-locale';

describe('provideSpanishLocale', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideNativeDateAdapter(),
        provideSpanishLocale(),
        CurrencyPipe,
        DecimalPipe,
        PercentPipe,
        DatePipe,
      ],
    });
  });

  it('sets the app locale to es', () => {
    expect(TestBed.inject(LOCALE_ID)).toBe('es');
  });

  it('formats currency, numbers, percentages and dates in Spanish', () => {
    expect(TestBed.inject(CurrencyPipe).transform(192, 'EUR')).toBe('192,00 €');
    expect(TestBed.inject(CurrencyPipe).transform(1234.5, 'EUR')).toBe('1.234,50 €');
    expect(TestBed.inject(DecimalPipe).transform(41.7, '1.1-1')).toBe('41,7');
    expect(TestBed.inject(PercentPipe).transform(0.75)).toBe('75 %');
    expect(TestBed.inject(DatePipe).transform('2026-06-08', 'fullDate')).toBe(
      'lunes, 8 de junio de 2026',
    );
  });

  it('makes the Material date pickers Spanish: Monday first and day/month/year input', () => {
    const adapter = TestBed.inject(DateAdapter<Date>);

    expect(adapter.getFirstDayOfWeek()).toBe(1);
    expect(adapter.getMonthNames('long')[5]).toBe('junio');
    expect(adapter.parse('10/6/2026', null)).toEqual(new Date(2026, 5, 10));
    expect(adapter.parse('3/11/2026', null)).toEqual(new Date(2026, 10, 3));
    expect(
      adapter.format(new Date(2026, 5, 10), { year: 'numeric', month: 'numeric', day: 'numeric' }),
    ).toBe('10/6/2026');
    expect(adapter.parse('', null)).toBeNull();
    expect(adapter.isValid(adapter.parse('32/13/2026', null) as Date)).toBe(false);
  });

  it('is part of the application config', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: appConfig.providers });

    expect(TestBed.inject(LOCALE_ID)).toBe('es');
    expect(TestBed.inject(DateAdapter).getFirstDayOfWeek()).toBe(1);
  });
});

import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import {
  DEFAULT_CURRENCY_CODE,
  EnvironmentProviders,
  Injectable,
  LOCALE_ID,
  makeEnvironmentProviders,
} from '@angular/core';
import { DateAdapter, MAT_DATE_LOCALE, NativeDateAdapter } from '@angular/material/core';

const DAY_MONTH_YEAR = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

/** Native adapter with Spanish conventions: weeks start on Monday and typed dates are day/month/year. */
@Injectable()
export class SpanishDateAdapter extends NativeDateAdapter {
  override getFirstDayOfWeek(): number {
    return 1;
  }

  override parse(value: unknown, parseFormat?: unknown): Date | null {
    const match = typeof value === 'string' ? DAY_MONTH_YEAR.exec(value.trim()) : null;
    if (!match) {
      return super.parse(value, parseFormat);
    }
    const [day, month, year] = match.slice(1).map(Number);
    const date = new Date(year, month - 1, day);
    // Reject overflow such as 31/2 instead of rolling it into March.
    return date.getMonth() === month - 1 && date.getDate() === day ? date : this.invalid();
  }
}

/**
 * Spanish formatting app-wide: `es` for Angular pipes (`192,00 €`, `41,7`, `lunes, 8 de junio de 2026`), EUR as
 * the default currency and Spanish Material date pickers. Provide it after `provideNativeDateAdapter()`.
 */
export function provideSpanishLocale(): EnvironmentProviders {
  registerLocaleData(localeEs, 'es');
  return makeEnvironmentProviders([
    { provide: LOCALE_ID, useValue: 'es' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'EUR' },
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    { provide: DateAdapter, useClass: SpanishDateAdapter },
  ]);
}

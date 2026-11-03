import { HttpParams } from '@angular/common/http';

type QueryValue = string | number | boolean | null | undefined;

/** Builds query params from a filter/page object, skipping unset values (undefined, null, ''). */
export function toHttpParams(query: object): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query) as [string, QueryValue][]) {
    if (value !== undefined && value !== null && value !== '') {
      params = params.set(key, value);
    }
  }
  return params;
}

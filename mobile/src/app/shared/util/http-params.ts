import { HttpParams } from '@angular/common/http';

/** Query params from an object, skipping `undefined`/`null` values. */
export function toHttpParams(query: object = {}): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      params = params.set(key, String(value));
    }
  }
  return params;
}

/** ISO-8601 date as sent by the API, e.g. `2026-10-20`. */
export type IsoDate = string;

/** ISO-8601 local time as sent by the API, e.g. `18:30:00`. */
export type IsoTime = string;

/** ISO-8601 local date-time as sent by the API, e.g. `2026-10-20T18:30:00`. */
export type IsoDateTime = string;

/** Uniform error body returned by every failing endpoint. */
export interface ApiError {
  timestamp: IsoDateTime;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: Record<string, string>;
}

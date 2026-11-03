/** ISO-8601 date, e.g. `2026-10-20`. */
export type IsoDate = string;

/** Local time `HH:mm`, e.g. `18:30`. */
export type IsoTime = string;

/** ISO-8601 UTC timestamp, e.g. `2026-10-20T18:30:00Z`. */
export type IsoDateTime = string;

/** Uniform error body returned by every failing endpoint (docs/api.md#conventions). */
export interface ApiError {
  timestamp: IsoDateTime;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: Record<string, string>;
}

/** Paginated list body (docs/api.md#conventions). */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Page metadata kept by facades for paginators. */
export type PageMeta = Omit<PageResponse<unknown>, 'content'>;

/** `?page=0&size=20&sort=field,asc` */
export interface PageRequest {
  page?: number;
  size?: number;
  /** `field,asc` | `field,desc` */
  sort?: string;
}

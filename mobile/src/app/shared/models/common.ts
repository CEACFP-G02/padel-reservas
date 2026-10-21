/** `YYYY-MM-DD` */
export type IsoDate = string;

/** `HH:mm` */
export type IsoTime = string;

/** `YYYY-MM-DDTHH:mm:ssZ` */
export type IsoTimestamp = string;

/** Uniform error body (docs/api.md#conventions). */
export interface ApiError {
  timestamp: IsoTimestamp;
  status: number;
  error: string;
  message: string;
  path: string;
}

/** Paginated list response (docs/api.md#conventions). */
export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PageRequest {
  page?: number;
  size?: number;
  /** `field,asc` | `field,desc` */
  sort?: string;
}

// Mirror the backend enums (persisted as strings). See docs/api.md.

export enum Role {
  OWNER = 'OWNER',
  CLIENT = 'CLIENT',
}

/** Wall material; whether the court is covered is the separate `indoor` flag. */
export enum CourtType {
  GLASS = 'GLASS',
  WALL = 'WALL',
}

export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

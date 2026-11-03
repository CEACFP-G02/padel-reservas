// Mirror docs/api.md (enums travel as strings).

export enum Role {
  OWNER = 'OWNER',
  CLIENT = 'CLIENT',
}

/** docs/api.md lists these as examples. */
export enum CourtType {
  GLASS = 'GLASS',
  WALL = 'WALL',
}

export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

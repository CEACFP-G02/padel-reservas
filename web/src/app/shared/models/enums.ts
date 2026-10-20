// Mirror the backend enums (persisted as strings). See docs/api.md#enums.

export enum Role {
  OWNER = 'OWNER',
  CLIENT = 'CLIENT',
}

export enum CourtType {
  INDOOR = 'INDOOR',
  OUTDOOR = 'OUTDOOR',
}

export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

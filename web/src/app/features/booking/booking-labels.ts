import { BookingStatus } from '../../shared/models';

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  [BookingStatus.CONFIRMED]: 'Confirmada',
  [BookingStatus.CANCELLED]: 'Cancelada',
  [BookingStatus.COMPLETED]: 'Completada',
};

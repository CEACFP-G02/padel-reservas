import { IsoDate } from './common';

export interface CourtBookingCount {
  courtId: number;
  courtName: string;
  bookings: number;
}

export interface DashboardSummary {
  from: IsoDate;
  to: IsoDate;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  revenue: number;
  bookingsByCourt: CourtBookingCount[];
}

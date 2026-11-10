import { IsoDate } from './common';

/** Today's owner KPIs (docs/api.md#dashboard--apiv1dashboard). */
export interface DashboardSummary {
  /** The day the "today" figures refer to (server clock). */
  date: IsoDate;
  activeCourts: number;
  /** CONFIRMED bookings dated today. */
  bookingsToday: number;
  /** CONFIRMED bookings from tomorrow through today + 7. */
  upcomingBookings: number;
  /** Percentage 0–100 with one decimal. */
  occupancyRate: number;
  /** EUR, sum of the slot price snapshots of today's CONFIRMED bookings. */
  revenueToday: number;
}

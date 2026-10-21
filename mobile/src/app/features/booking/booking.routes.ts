import { Routes } from '@angular/router';

export default [
  { path: '', loadComponent: () => import('./pages/my-bookings.page').then((m) => m.MyBookingsPage) },
  { path: ':id', loadComponent: () => import('./pages/booking-detail.page').then((m) => m.BookingDetailPage) },
] satisfies Routes;

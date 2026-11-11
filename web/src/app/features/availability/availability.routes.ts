import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pages/availability.page').then((m) => m.AvailabilityPage),
  },
] satisfies Routes;

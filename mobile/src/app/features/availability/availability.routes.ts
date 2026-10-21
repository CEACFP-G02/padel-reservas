import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pages/availability-search.page').then((m) => m.AvailabilitySearchPage),
  },
  { path: 'courts', loadChildren: () => import('../court/court.routes') },
] satisfies Routes;

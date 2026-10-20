import { Routes } from '@angular/router';

export default [
  { path: '', loadComponent: () => import('./pages/schedule.page').then((m) => m.SchedulePage) },
] satisfies Routes;

import { Routes } from '@angular/router';

export default [
  { path: '', loadComponent: () => import('./pages/court-blocks.page').then((m) => m.CourtBlocksPage) },
] satisfies Routes;

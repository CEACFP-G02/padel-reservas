import { Routes } from '@angular/router';

export default [
  { path: '', loadComponent: () => import('./pages/court-list.page').then((m) => m.CourtListPage) },
  { path: ':id', loadComponent: () => import('./pages/court-detail.page').then((m) => m.CourtDetailPage) },
] satisfies Routes;

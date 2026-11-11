import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pages/client-list.page').then((m) => m.ClientListPage),
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/client-detail.page').then((m) => m.ClientDetailPage),
  },
] satisfies Routes;

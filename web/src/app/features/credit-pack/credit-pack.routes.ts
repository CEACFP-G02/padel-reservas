import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pages/credit-pack-list.page').then((m) => m.CreditPackListPage),
  },
] satisfies Routes;

import { Routes } from '@angular/router';

export default [
  { path: '', loadComponent: () => import('./pages/wallet.page').then((m) => m.WalletPage) },
  {
    path: 'cards',
    loadComponent: () => import('../payment-method/pages/payment-methods.page').then((m) => m.PaymentMethodsPage),
  },
] satisfies Routes;

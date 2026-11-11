import { Routes } from '@angular/router';

import { ownerGuard } from './core/auth/owner.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    loadComponent: () => import('./shared/ui/shell/shell').then((m) => m.Shell),
    canActivate: [ownerGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.routes') },
      { path: 'availability', loadChildren: () => import('./features/availability/availability.routes') },
      { path: 'bookings', loadChildren: () => import('./features/booking/booking.routes') },
      { path: 'courts', loadChildren: () => import('./features/court/court.routes') },
      { path: 'courts/:courtId/schedule', loadChildren: () => import('./features/schedule/schedule.routes') },
      { path: 'courts/:courtId/blocks', loadChildren: () => import('./features/courtblock/courtblock.routes') },
      { path: 'clients', loadChildren: () => import('./features/user/user.routes') },
      {
        path: 'credit-packs',
        loadChildren: () => import('./features/credit-pack/credit-pack.routes'),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];

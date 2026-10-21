import { Routes } from '@angular/router';

import { clientGuard } from './core/auth/client.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/pages/login.page').then((m) => m.LoginPage) },
  { path: 'register', loadComponent: () => import('./features/auth/pages/register.page').then((m) => m.RegisterPage) },
  {
    path: 'tabs',
    loadComponent: () => import('./shared/ui/tabs.page').then((m) => m.TabsPage),
    canActivate: [clientGuard],
    children: [
      { path: 'availability', loadChildren: () => import('./features/availability/availability.routes') },
      { path: 'bookings', loadChildren: () => import('./features/booking/booking.routes') },
      { path: 'profile', loadChildren: () => import('./features/profile/profile.routes') },
      { path: '', pathMatch: 'full', redirectTo: 'availability' },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'tabs/availability' },
  { path: '**', redirectTo: 'tabs/availability' },
];

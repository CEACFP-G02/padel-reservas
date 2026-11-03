import { Routes } from '@angular/router';

export default [
  { path: '', loadComponent: () => import('./pages/profile.page').then((m) => m.ProfilePage) },
] satisfies Routes;

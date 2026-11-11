import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';
import { map } from 'rxjs';

import { AuthFacade } from '../../../core/auth/auth.facade';
import { NavItem, NavList } from '../nav-list/nav-list';

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', link: '/dashboard' },
  { label: 'Ocupación', icon: 'calendar_month', link: '/availability' },
  { label: 'Reservas', icon: 'event', link: '/bookings' },
  { label: 'Pistas', icon: 'sports_tennis', link: '/courts' },
  { label: 'Clientes', icon: 'group', link: '/clients' },
];

/** Authenticated layout: toolbar + side navigation + routed content. */
@Component({
  selector: 'app-shell',
  imports: [MatSidenavModule, MatToolbarModule, MatButtonModule, MatIconModule, RouterOutlet, NavList],
  template: `
    <mat-sidenav-container class="shell">
      <mat-sidenav #sidenav [mode]="isHandset() ? 'over' : 'side'" [opened]="!isHandset()">
        <mat-toolbar>Padel Admin</mat-toolbar>
        <app-nav-list [items]="navItems" (click)="isHandset() && sidenav.close()" />
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar>
          @if (isHandset()) {
            <button matIconButton (click)="sidenav.toggle()" aria-label="Abrir menú">
              <mat-icon>menu</mat-icon>
            </button>
          }
          <span class="spacer"></span>
          <span>{{ userEmail() }}</span>
          <button matIconButton (click)="auth.logout()" aria-label="Cerrar sesión">
            <mat-icon>logout</mat-icon>
          </button>
        </mat-toolbar>
        <main class="content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    .shell { height: 100%; }
    mat-sidenav { width: 240px; }
    .spacer { flex: 1; }
    .content { padding: 24px; }
  `,
})
export class Shell {
  protected readonly auth = inject(AuthFacade);
  protected readonly navItems = NAV_ITEMS;
  protected readonly userEmail = computed(() => this.auth.currentUser()?.email ?? '');
  protected readonly isHandset = toSignal(
    inject(BreakpointObserver).observe(Breakpoints.Handset).pipe(map((result) => result.matches)),
    { initialValue: false },
  );
}

import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { AuthFacade } from '../../../core/auth/auth.facade';
import { navItems } from '../nav-list/nav-items';
import { NavList } from '../nav-list/nav-list';

/** Authenticated layout: top bar with wordmark and user menu, side navigation, routed content. */
@Component({
  selector: 'app-shell',
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    RouterLink,
    RouterOutlet,
    NavList,
  ],
  template: `
    <mat-toolbar class="topbar">
      <button matIconButton (click)="sidenav.toggle()" aria-label="Abrir menú">
        <mat-icon>menu</mat-icon>
      </button>
      <a class="wordmark" routerLink="/dashboard" aria-label="Pádel Reservas">
        <span class="wordmark-badge"><mat-icon>sports_tennis</mat-icon></span>
        <span class="wordmark-text">Pádel <strong>Reservas</strong></span>
      </a>
      <span class="spacer"></span>
      <button
        matButton
        class="user"
        [matMenuTriggerFor]="userMenu"
        aria-label="Menú de usuario"
        data-testid="user-menu"
      >
        <span class="avatar" aria-hidden="true">
          @if (initial()) {
            {{ initial() }}
          } @else {
            <mat-icon>person</mat-icon>
          }
        </span>
        <span class="user-name">{{ userName() }}</span>
        <mat-icon iconPositionEnd>expand_more</mat-icon>
      </button>
      <mat-menu #userMenu="matMenu" xPosition="before">
        <div class="menu-header">
          <strong>{{ userName() }}</strong>
          <span>{{ userEmail() }}</span>
        </div>
        <mat-divider />
        <button mat-menu-item (click)="auth.logout()">
          <mat-icon>logout</mat-icon>
          <span>Cerrar sesión</span>
        </button>
      </mat-menu>
    </mat-toolbar>

    <mat-sidenav-container class="shell">
      <mat-sidenav #sidenav [mode]="isHandset() ? 'over' : 'side'" [opened]="!isHandset()">
        <app-nav-list [items]="navItems()" (click)="isHandset() && sidenav.close()" />
      </mat-sidenav>

      <mat-sidenav-content>
        <main class="content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .topbar {
      position: relative;
      z-index: 3;
      gap: 8px;
      padding: 0 16px 0 8px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      box-shadow: var(--app-shadow-sm);
    }
    .wordmark {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      color: inherit;
      text-decoration: none;
    }
    .wordmark-badge {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border-radius: var(--app-radius-sm);
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      box-shadow: inset 0 -3px 0 var(--app-accent);
    }
    .wordmark-text {
      font: var(--mat-sys-title-large);
      letter-spacing: -0.01em;
    }
    .wordmark-text strong {
      color: var(--mat-sys-primary);
      font-weight: 700;
    }
    .spacer {
      flex: 1;
    }
    .user {
      --mat-button-text-label-text-color: var(--mat-sys-on-surface);
    }
    .avatar {
      display: inline-grid;
      place-items: center;
      width: 32px;
      height: 32px;
      margin-right: 8px;
      border-radius: 50%;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      font-weight: 600;
    }
    .avatar mat-icon {
      width: 20px;
      height: 20px;
      font-size: 20px;
      margin: 0;
    }
    .menu-header {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 12px 16px;
      font: var(--mat-sys-body-medium);
    }
    .menu-header span {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
    .shell {
      flex: 1;
    }
    mat-sidenav {
      width: 248px;
      border-right: 1px solid var(--mat-sys-outline-variant);
    }
    .content {
      max-width: 1280px;
      margin: 0 auto;
      padding: 32px;
    }
    @media (max-width: 599.98px) {
      .user-name,
      .wordmark-text {
        display: none;
      }
      .content {
        padding: 16px;
      }
    }
  `,
})
export class Shell {
  protected readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );
  protected readonly navItems = computed(() => navItems(this.url()));
  protected readonly userEmail = computed(() => this.auth.currentUser()?.email ?? '');
  protected readonly userName = computed(() => this.auth.currentUser()?.name || this.userEmail());
  protected readonly initial = computed(() => this.userName().charAt(0).toUpperCase());
  protected readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe(Breakpoints.Handset)
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );
}

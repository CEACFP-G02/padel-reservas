import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';

import { NavItem } from './nav-items';

export type { NavItem } from './nav-items';

@Component({
  selector: 'app-nav-list',
  imports: [MatListModule, MatIconModule, RouterLink],
  template: `
    <mat-nav-list class="nav">
      @for (item of items(); track item.label) {
        <a
          mat-list-item
          [routerLink]="item.link"
          [activated]="item.active"
          [attr.aria-current]="item.active ? 'page' : null"
        >
          <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
          <span matListItemTitle>{{ item.label }}</span>
        </a>
      }
    </mat-nav-list>
  `,
  styles: `
    .nav {
      padding: 8px 12px;
    }
    .nav a {
      margin-bottom: 4px;
    }
    .nav a.mdc-list-item--activated mat-icon,
    .nav a.mdc-list-item--activated .mdc-list-item__primary-text {
      color: var(--mat-sys-on-secondary-container);
      font-weight: 600;
    }
  `,
})
export class NavList {
  readonly items = input.required<NavItem[]>();
}

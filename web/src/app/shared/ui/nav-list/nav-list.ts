import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface NavItem {
  label: string;
  icon: string;
  link: string;
}

@Component({
  selector: 'app-nav-list',
  imports: [MatListModule, MatIconModule, RouterLink, RouterLinkActive],
  template: `
    <mat-nav-list>
      @for (item of items(); track item.link) {
        <a mat-list-item [routerLink]="item.link" routerLinkActive #rla="routerLinkActive" [activated]="rla.isActive">
          <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
          <span matListItemTitle>{{ item.label }}</span>
        </a>
      }
    </mat-nav-list>
  `,
})
export class NavList {
  readonly items = input.required<NavItem[]>();
}

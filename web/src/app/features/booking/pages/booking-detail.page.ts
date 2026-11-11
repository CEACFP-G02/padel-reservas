import { CurrencyPipe } from '@angular/common';
import { Component, effect, inject, input, numberAttribute } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';

import { BookingFacade } from '../booking.facade';

@Component({
  selector: 'app-booking-detail-page',
  imports: [MatCardModule, MatListModule, RouterLink, CurrencyPipe],
  template: `
    @if (facade.selected(); as booking) {
      <mat-card appearance="outlined" class="detail-card">
        <mat-card-header>
          <mat-card-title>Reserva #{{ booking.id }} · {{ booking.status }}</mat-card-title>
          <mat-card-subtitle
            >{{ booking.courtName }} · {{ booking.date }} ·
            <a data-testid="booking-client" [routerLink]="['/clients', booking.userId]">{{
              booking.userName
            }}</a></mat-card-subtitle
          >
        </mat-card-header>
        <mat-card-content>
          <mat-list>
            @for (slot of booking.slots; track slot.start) {
              <mat-list-item
                >{{ slot.start }} – {{ slot.end }} ·
                {{ slot.price | currency: 'EUR' }}</mat-list-item
              >
            }
          </mat-list>
          <p class="total">Total: {{ booking.totalPrice | currency: 'EUR' }}</p>
        </mat-card-content>
      </mat-card>
    } @else {
      <p class="muted">Cargando reserva {{ id() }}…</p>
    }
  `,
  styles: `
    .total {
      margin: var(--app-space-2) 0 0;
      font: var(--mat-sys-title-medium);
      font-weight: 600;
    }
  `,
})
export class BookingDetailPage {
  protected readonly facade = inject(BookingFacade);
  readonly id = input.required({ transform: numberAttribute });

  constructor() {
    effect(() => void this.facade.getBooking(this.id()));
  }
}

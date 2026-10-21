import { CurrencyPipe } from '@angular/common';
import { Component, effect, inject, input, numberAttribute } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';

import { BookingFacade } from '../booking.facade';

@Component({
  selector: 'app-booking-detail-page',
  imports: [MatCardModule, MatListModule, CurrencyPipe],
  template: `
    @if (facade.selected(); as booking) {
      <mat-card>
        <mat-card-header>
          <mat-card-title>Reserva #{{ booking.id }} · {{ booking.status }}</mat-card-title>
          <mat-card-subtitle>{{ booking.courtName }} · {{ booking.date }} · cliente #{{ booking.userId }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <mat-list>
            @for (slot of booking.slots; track slot.start) {
              <mat-list-item>{{ slot.start }} – {{ slot.end }} · {{ slot.price | currency: 'EUR' }}</mat-list-item>
            }
          </mat-list>
          <p>Total: {{ booking.totalPrice | currency: 'EUR' }}</p>
        </mat-card-content>
      </mat-card>
    } @else {
      <p>Cargando reserva {{ id() }}…</p>
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

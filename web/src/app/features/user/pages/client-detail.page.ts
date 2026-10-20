import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, numberAttribute } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import { UserFacade } from '../user.facade';

@Component({
  selector: 'app-client-detail-page',
  imports: [MatCardModule, DatePipe],
  template: `
    @if (facade.selected(); as client) {
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ client.firstName }} {{ client.lastName }}</mat-card-title>
          <mat-card-subtitle>{{ client.email }} · {{ client.phone }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>{{ client.active ? 'Activo' : 'Inactivo' }} · alta {{ client.createdAt | date }}</p>
          <!-- TODO: client's bookings (BookingFacade.listBookings filtered by user) — see docs/api.md#get-apiv1bookings -->
        </mat-card-content>
      </mat-card>
    } @else {
      <p>Cargando cliente {{ id() }}…</p>
    }
  `,
})
export class ClientDetailPage {
  protected readonly facade = inject(UserFacade);
  readonly id = input.required({ transform: numberAttribute });

  constructor() {
    effect(() => void this.facade.getClient(this.id()));
  }
}

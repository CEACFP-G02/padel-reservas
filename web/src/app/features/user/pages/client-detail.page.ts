import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, effect, inject, input, numberAttribute, untracked } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';

import { Booking, BookingStatus } from '../../../shared/models';
import { BOOKING_STATUS_LABELS } from '../../booking/booking-labels';
import { UserFacade } from '../user.facade';

const PAGE_SIZE = 10;

/** One client and their bookings (GET /users/{id}/bookings), most recent first. */
@Component({
  selector: 'app-client-detail-page',
  imports: [
    MatCardModule,
    MatChipsModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
  ],
  template: `
    @if (facade.selected(); as client) {
      <mat-card appearance="outlined" class="detail-card">
        <mat-card-header>
          <mat-card-title>{{ client.name }}</mat-card-title>
          <mat-card-subtitle
            >{{ client.email }} · {{ client.phone ?? 'sin teléfono' }}</mat-card-subtitle
          >
        </mat-card-header>
        @if (!client.active) {
          <mat-card-content>
            <mat-chip-set
              ><mat-chip data-testid="client-inactive">Dado de baja</mat-chip></mat-chip-set
            >
          </mat-card-content>
        }
      </mat-card>
    } @else if (facade.selectedError(); as error) {
      <p class="error" role="alert" data-testid="client-error">{{ error }}</p>
    } @else {
      <p class="muted">Cargando cliente {{ id() }}…</p>
    }

    <h2>Reservas</h2>
    @if (facade.clientBookingsLoading()) {
      <mat-progress-bar mode="indeterminate" />
    }
    @if (facade.clientBookingsError(); as error) {
      <p class="error" role="alert" data-testid="bookings-error">{{ error }}</p>
    }

    <div class="table-card">
      <table mat-table [dataSource]="facade.clientBookings()">
        <ng-container matColumnDef="court">
          <th mat-header-cell *matHeaderCellDef>Pista</th>
          <td mat-cell *matCellDef="let b">
            <a [routerLink]="['/bookings', b.id]">{{ b.courtName }}</a>
          </td>
        </ng-container>
        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Fecha</th>
          <td mat-cell *matCellDef="let b">{{ b.date | date: 'mediumDate' }}</td>
        </ng-container>
        <ng-container matColumnDef="time">
          <th mat-header-cell *matHeaderCellDef>Horario</th>
          <td mat-cell *matCellDef="let b">{{ range(b) }}</td>
        </ng-container>
        <ng-container matColumnDef="totalPrice">
          <th mat-header-cell *matHeaderCellDef>Importe</th>
          <td mat-cell *matCellDef="let b">{{ b.totalPrice | currency }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let b" [class.cancelled]="b.status === cancelled">
            {{ statusLabel(b.status) }}
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns" data-testid="booking-row"></tr>
        <tr class="mat-mdc-row" *matNoDataRow>
          <td class="mat-mdc-cell empty" [attr.colspan]="columns.length">
            {{
              facade.clientBookingsLoading()
                ? 'Cargando reservas…'
                : facade.clientBookingsError()
                  ? ''
                  : 'Este cliente todavía no tiene reservas.'
            }}
          </td>
        </tr>
      </table>
      <mat-paginator
        [length]="facade.clientBookingsPage()?.totalElements ?? 0"
        [pageIndex]="facade.clientBookingsPage()?.page ?? 0"
        [pageSize]="facade.clientBookingsPage()?.size ?? pageSize"
        [pageSizeOptions]="[10, 20, 50]"
        (page)="changePage($event)"
      />
    </div>
  `,
})
export class ClientDetailPage {
  protected readonly facade = inject(UserFacade);
  readonly id = input.required({ transform: numberAttribute });
  protected readonly columns = ['court', 'date', 'time', 'totalPrice', 'status'];
  protected readonly pageSize = PAGE_SIZE;
  protected readonly cancelled = BookingStatus.CANCELLED;

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => {
        void this.facade.getClient(id);
        void this.facade.listClientBookings(id, { size: PAGE_SIZE });
      });
    });
  }

  protected range(booking: Booking): string {
    const starts = booking.slots.map((slot) => slot.start).sort();
    const ends = booking.slots.map((slot) => slot.end).sort();
    return `${starts[0]} – ${ends[ends.length - 1]}`;
  }

  protected statusLabel(status: BookingStatus): string {
    return BOOKING_STATUS_LABELS[status];
  }

  protected changePage(event: PageEvent): void {
    void this.facade.listClientBookings(this.id(), { page: event.pageIndex, size: event.pageSize });
  }
}

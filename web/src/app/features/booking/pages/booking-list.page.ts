import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';

import { Booking, BookingStatus } from '../../../shared/models';
import { toIsoDate } from '../../../shared/util/date';
import { BookingFacade } from '../booking.facade';
import { BookingFormDialog } from './booking-form.dialog';

@Component({
  selector: 'app-booking-list-page',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatProgressBarModule,
    MatPaginatorModule,
    RouterLink,
    CurrencyPipe,
  ],
  template: `
    <header class="page-header">
      <h1>Reservas</h1>
      <button matButton="filled" (click)="openCreate()"><mat-icon>add</mat-icon> Reserva manual</button>
    </header>

    <mat-form-field>
      <mat-label>Fecha</mat-label>
      <input matInput [matDatepicker]="picker" (dateChange)="filterByDate($event.value)" />
      <mat-datepicker-toggle matIconSuffix [for]="picker" />
      <mat-datepicker #picker />
    </mat-form-field>

    @if (facade.loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <table mat-table [dataSource]="facade.bookings()">
      <ng-container matColumnDef="id">
        <th mat-header-cell *matHeaderCellDef>#</th>
        <td mat-cell *matCellDef="let b"><a [routerLink]="[b.id]">{{ b.id }}</a></td>
      </ng-container>
      <ng-container matColumnDef="date">
        <th mat-header-cell *matHeaderCellDef>Fecha</th>
        <td mat-cell *matCellDef="let b">{{ b.date }}</td>
      </ng-container>
      <ng-container matColumnDef="court">
        <th mat-header-cell *matHeaderCellDef>Pista</th>
        <td mat-cell *matCellDef="let b">{{ b.courtName }}</td>
      </ng-container>
      <ng-container matColumnDef="client">
        <th mat-header-cell *matHeaderCellDef>Cliente</th>
        <td mat-cell *matCellDef="let b">
          <a data-testid="booking-client" [routerLink]="['/clients', b.userId]">{{ b.userName }}</a>
        </td>
      </ng-container>
      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>Estado</th>
        <td mat-cell *matCellDef="let b">{{ b.status }}</td>
      </ng-container>
      <ng-container matColumnDef="totalPrice">
        <th mat-header-cell *matHeaderCellDef>Importe</th>
        <td mat-cell *matCellDef="let b">{{ b.totalPrice | currency: 'EUR' }}</td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let b">
          <button matIconButton (click)="openReschedule(b)" [disabled]="b.status !== confirmed" aria-label="Reprogramar">
            <mat-icon>edit_calendar</mat-icon>
          </button>
          <button matIconButton (click)="cancel(b)" [disabled]="b.status !== confirmed" aria-label="Cancelar">
            <mat-icon>cancel</mat-icon>
          </button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns"></tr>
    </table>
    <mat-paginator
      [length]="facade.page()?.totalElements ?? 0"
      [pageIndex]="facade.page()?.page ?? 0"
      [pageSize]="facade.page()?.size ?? 20"
      [pageSizeOptions]="[10, 20, 50]"
      (page)="changePage($event)"
    />
  `,
})
export class BookingListPage {
  protected readonly facade = inject(BookingFacade);
  private readonly dialog = inject(MatDialog);
  protected readonly confirmed = BookingStatus.CONFIRMED;
  protected readonly columns = ['id', 'date', 'court', 'client', 'status', 'totalPrice', 'actions'];

  constructor() {
    void this.facade.listBookings();
  }

  protected filterByDate(date: Date | null): void {
    void this.facade.listBookings({ ...this.facade.filters(), date: date ? toIsoDate(date) : undefined, page: 0 });
  }

  protected changePage(event: PageEvent): void {
    void this.facade.listBookings({ ...this.facade.filters(), page: event.pageIndex, size: event.pageSize });
  }

  protected openCreate(): void {
    // TODO: on close with a request -> facade.createBooking(request); snackbar on 409 — see docs/api.md#bookings--apiv1bookings
    this.dialog.open(BookingFormDialog);
  }

  protected openReschedule(booking: Booking): void {
    // TODO: on close with a request -> facade.rescheduleBooking(booking.id, request) — see docs/api.md#bookings--apiv1bookings
    this.dialog.open(BookingFormDialog, { data: booking });
  }

  protected cancel(booking: Booking): void {
    // TODO: confirm dialog + snackbar (DELETE soft-cancels) — see docs/api.md#bookings--apiv1bookings
    void this.facade.cancelBooking(booking.id);
  }
}

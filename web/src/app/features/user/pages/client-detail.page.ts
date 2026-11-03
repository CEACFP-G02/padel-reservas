import { CurrencyPipe } from '@angular/common';
import { Component, effect, inject, input, numberAttribute } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';

import { UserFacade } from '../user.facade';

@Component({
  selector: 'app-client-detail-page',
  imports: [MatCardModule, MatTableModule, MatPaginatorModule, RouterLink, CurrencyPipe],
  template: `
    @if (facade.selected(); as client) {
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ client.name }}</mat-card-title>
          <mat-card-subtitle>{{ client.email }} · {{ client.phone ?? 'sin teléfono' }}</mat-card-subtitle>
        </mat-card-header>
      </mat-card>

      <h2>Reservas</h2>
      <table mat-table [dataSource]="facade.clientBookings()">
        <ng-container matColumnDef="id">
          <th mat-header-cell *matHeaderCellDef>#</th>
          <td mat-cell *matCellDef="let b"><a [routerLink]="['/bookings', b.id]">{{ b.id }}</a></td>
        </ng-container>
        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Fecha</th>
          <td mat-cell *matCellDef="let b">{{ b.date }}</td>
        </ng-container>
        <ng-container matColumnDef="court">
          <th mat-header-cell *matHeaderCellDef>Pista</th>
          <td mat-cell *matCellDef="let b">{{ b.courtName }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let b">{{ b.status }}</td>
        </ng-container>
        <ng-container matColumnDef="totalPrice">
          <th mat-header-cell *matHeaderCellDef>Importe</th>
          <td mat-cell *matCellDef="let b">{{ b.totalPrice | currency: 'EUR' }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
      <mat-paginator
        [length]="facade.clientBookingsPage()?.totalElements ?? 0"
        [pageIndex]="facade.clientBookingsPage()?.page ?? 0"
        [pageSize]="facade.clientBookingsPage()?.size ?? 10"
        [pageSizeOptions]="[10, 20, 50]"
        (page)="changePage($event)"
      />
    } @else {
      <p>Cargando cliente {{ id() }}…</p>
    }
  `,
})
export class ClientDetailPage {
  protected readonly facade = inject(UserFacade);
  readonly id = input.required({ transform: numberAttribute });
  protected readonly columns = ['id', 'date', 'court', 'status', 'totalPrice'];

  constructor() {
    effect(() => {
      const id = this.id();
      void this.facade.getClient(id);
      void this.facade.listClientBookings(id, { size: 10 });
    });
  }

  protected changePage(event: PageEvent): void {
    void this.facade.listClientBookings(this.id(), { page: event.pageIndex, size: event.pageSize });
  }
}

import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

import { DashboardFacade } from '../dashboard.facade';

@Component({
  selector: 'app-dashboard-page',
  imports: [MatCardModule, MatDatepickerModule, MatFormFieldModule, MatInputModule, MatTableModule, CurrencyPipe],
  template: `
    <h1>Dashboard</h1>

    <mat-form-field>
      <mat-label>Periodo</mat-label>
      <mat-date-range-input [rangePicker]="picker">
        <input matStartDate #from placeholder="Desde" />
        <input matEndDate #to placeholder="Hasta" (dateChange)="load(from.value, to.value)" />
      </mat-date-range-input>
      <mat-datepicker-toggle matIconSuffix [for]="picker" />
      <mat-date-range-picker #picker />
    </mat-form-field>

    @if (facade.summary(); as summary) {
      <div class="kpis">
        <mat-card><mat-card-content>Reservas: {{ summary.totalBookings }}</mat-card-content></mat-card>
        <mat-card><mat-card-content>Confirmadas: {{ summary.confirmedBookings }}</mat-card-content></mat-card>
        <mat-card><mat-card-content>Canceladas: {{ summary.cancelledBookings }}</mat-card-content></mat-card>
        <mat-card><mat-card-content>Ingresos: {{ summary.revenue | currency: 'EUR' }}</mat-card-content></mat-card>
      </div>

      <table mat-table [dataSource]="summary.bookingsByCourt">
        <ng-container matColumnDef="courtName">
          <th mat-header-cell *matHeaderCellDef>Pista</th>
          <td mat-cell *matCellDef="let row">{{ row.courtName }}</td>
        </ng-container>
        <ng-container matColumnDef="bookings">
          <th mat-header-cell *matHeaderCellDef>Reservas</th>
          <td mat-cell *matCellDef="let row">{{ row.bookings }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
    }
  `,
  styles: `.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }`,
})
export class DashboardPage {
  protected readonly facade = inject(DashboardFacade);
  protected readonly columns = ['courtName', 'bookings'];

  constructor() {
    void this.facade.getDashboardSummary();
  }

  protected load(from: string, to: string): void {
    // TODO: bind the range picker to Date values (FormGroup) and pass toIsoDate(from/to)
    //  — see docs/api.md#dashboard--apiv1dashboard
    void this.facade.getDashboardSummary(from || undefined, to || undefined);
  }
}

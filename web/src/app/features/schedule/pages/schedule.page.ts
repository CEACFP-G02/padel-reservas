import { CurrencyPipe } from '@angular/common';
import { Component, effect, inject, input, numberAttribute } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';

import { DayOfWeek } from '../../../shared/models';
import { ScheduleFacade } from '../schedule.facade';

@Component({
  selector: 'app-schedule-page',
  imports: [MatTableModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressBarModule, CurrencyPipe],
  template: `
    <h1>Horario de la pista {{ courtId() }}</h1>

    @if (facade.loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <mat-form-field>
      <mat-label>Duración del turno (min)</mat-label>
      <input matInput type="number" [value]="facade.schedule()?.slotMinutes ?? 60" />
    </mat-form-field>
    <mat-form-field>
      <mat-label>Precio por turno (€)</mat-label>
      <input matInput type="number" min="0" step="0.5" [value]="facade.schedule()?.price ?? 0" />
    </mat-form-field>
    @if (facade.schedule(); as schedule) {
      <p>Precio actual: {{ schedule.price | currency: 'EUR' }} / {{ schedule.slotMinutes }} min</p>
    }

    <table mat-table [dataSource]="facade.schedule()?.weekdays ?? []">
      <ng-container matColumnDef="day">
        <th mat-header-cell *matHeaderCellDef>Día</th>
        <td mat-cell *matCellDef="let row">{{ dayLabel(row.day) }}</td>
      </ng-container>
      <ng-container matColumnDef="open">
        <th mat-header-cell *matHeaderCellDef>Apertura</th>
        <td mat-cell *matCellDef="let row">{{ row.open }}</td>
      </ng-container>
      <ng-container matColumnDef="close">
        <th mat-header-cell *matHeaderCellDef>Cierre</th>
        <td mat-cell *matCellDef="let row">{{ row.close }}</td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns"></tr>
    </table>

    <button matButton="filled" (click)="save()">Guardar horario</button>
  `,
})
export class SchedulePage {
  protected readonly facade = inject(ScheduleFacade);
  readonly courtId = input.required({ transform: numberAttribute });
  protected readonly columns = ['day', 'open', 'close'];
  private readonly dayLabels: Record<DayOfWeek, string> = {
    MONDAY: 'Lunes',
    TUESDAY: 'Martes',
    WEDNESDAY: 'Miércoles',
    THURSDAY: 'Jueves',
    FRIDAY: 'Viernes',
    SATURDAY: 'Sábado',
    SUNDAY: 'Domingo',
  };

  constructor() {
    effect(() => void this.facade.getSchedule(this.courtId()));
  }

  protected dayLabel(day: DayOfWeek): string {
    return this.dayLabels[day];
  }

  protected save(): void {
    // TODO: editable form (slotMinutes, price, FormArray of weekdays { day, open, close } in HH:mm)
    //  -> facade.updateSchedule(courtId, value) — see docs/api.md#schedule--apiv1courtsidschedule
  }
}

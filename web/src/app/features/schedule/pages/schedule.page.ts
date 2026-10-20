import { Component, effect, inject, input, numberAttribute } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';

import { ScheduleFacade } from '../schedule.facade';

@Component({
  selector: 'app-schedule-page',
  imports: [MatTableModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressBarModule],
  template: `
    <h1>Horario de la pista {{ courtId() }}</h1>

    @if (facade.loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <mat-form-field>
      <mat-label>Duración del turno (min)</mat-label>
      <input matInput type="number" [value]="facade.schedule()?.slotDurationMinutes ?? 90" />
    </mat-form-field>

    <table mat-table [dataSource]="facade.schedule()?.openingHours ?? []">
      <ng-container matColumnDef="dayOfWeek">
        <th mat-header-cell *matHeaderCellDef>Día</th>
        <td mat-cell *matCellDef="let row">{{ row.dayOfWeek }}</td>
      </ng-container>
      <ng-container matColumnDef="openTime">
        <th mat-header-cell *matHeaderCellDef>Apertura</th>
        <td mat-cell *matCellDef="let row">{{ row.openTime }}</td>
      </ng-container>
      <ng-container matColumnDef="closeTime">
        <th mat-header-cell *matHeaderCellDef>Cierre</th>
        <td mat-cell *matCellDef="let row">{{ row.closeTime }}</td>
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
  protected readonly columns = ['dayOfWeek', 'openTime', 'closeTime'];

  constructor() {
    effect(() => void this.facade.getSchedule(this.courtId()));
  }

  protected save(): void {
    // TODO: editable form (FormArray of opening hours) -> facade.updateSchedule(courtId, value)
    //  — see docs/api.md#put-apiv1courtscourtidschedule
  }
}

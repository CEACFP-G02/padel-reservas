import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, input, numberAttribute } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';

import { Schedule } from '../../../shared/models';
import { CourtFacade } from '../../court/court.facade';
import { DAYS, DAY_LABELS } from '../schedule-labels';
import { ScheduleFacade } from '../schedule.facade';
import { ScheduleFormDialog, ScheduleFormDialogData } from './schedule-form.dialog';

interface DayRow {
  label: string;
  hours: string;
}

/** OWNER: a court's weekly schedule, read-only here and edited (full replacement) in {@link ScheduleFormDialog}. */
@Component({
  selector: 'app-schedule-page',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    CurrencyPipe,
    RouterLink,
  ],
  template: `
    <header class="page-header">
      <a matButton routerLink="/courts" data-testid="back"
        ><mat-icon>arrow_back</mat-icon> Pistas</a
      >
      <h1>Horario de «{{ courtName() }}»</h1>
      <span class="spacer"></span>
      @if (!facade.loading() && !facade.error()) {
        <button matButton="filled" (click)="openEdit()" data-testid="edit">
          <mat-icon>edit_calendar</mat-icon>
          {{ facade.schedule() ? 'Editar horario' : 'Crear horario' }}
        </button>
      }
    </header>

    @if (facade.loading()) {
      <mat-progress-bar mode="indeterminate" />
    }
    @if (facade.error(); as error) {
      <p class="error" role="alert" data-testid="load-error">{{ error }}</p>
    }

    @if (facade.schedule(); as schedule) {
      <p data-testid="summary">
        Turnos de {{ schedule.slotMinutes }} min · {{ schedule.price | currency: 'EUR' }} por turno
      </p>
      <table mat-table [dataSource]="rows()">
        <ng-container matColumnDef="day">
          <th mat-header-cell *matHeaderCellDef>Día</th>
          <td mat-cell *matCellDef="let row">{{ row.label }}</td>
        </ng-container>
        <ng-container matColumnDef="hours">
          <th mat-header-cell *matHeaderCellDef>Horario</th>
          <td mat-cell *matCellDef="let row" [class.closed]="row.hours === 'Cerrado'">
            {{ row.hours }}
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns" data-testid="day-row"></tr>
      </table>
    } @else if (!facade.loading() && !facade.error()) {
      <p class="empty">Esta pista todavía no tiene horario.</p>
    }
  `,
  styles: `
    .page-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .spacer {
      flex: 1;
    }
    .error {
      color: var(--mat-sys-error);
    }
    .closed,
    .empty {
      color: var(--mat-sys-on-surface-variant);
      font-style: italic;
    }
  `,
})
export class SchedulePage {
  protected readonly facade = inject(ScheduleFacade);
  private readonly courts = inject(CourtFacade);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly courtId = input.required({ transform: numberAttribute });

  protected readonly columns = ['day', 'hours'];

  protected readonly courtName = computed(() => {
    const court = this.courts.selected();
    return court?.id === this.courtId() ? court.name : `Pista ${this.courtId()}`;
  });

  /** Every weekday in order, with its sorted ranges or "Cerrado". */
  protected readonly rows = computed<DayRow[]>(() => {
    const weekdays = this.facade.schedule()?.weekdays ?? [];
    return DAYS.map((day) => {
      const ranges = weekdays
        .filter((range) => range.day === day)
        .sort((a, b) => a.open.localeCompare(b.open))
        .map((range) => `${range.open}–${range.close}`);
      return { label: DAY_LABELS[day], hours: ranges.length ? ranges.join(', ') : 'Cerrado' };
    });
  });

  constructor() {
    effect(() => {
      const courtId = this.courtId();
      void this.facade.getSchedule(courtId);
      void this.courts.getCourt(courtId).catch(() => undefined);
    });
  }

  protected openEdit(): void {
    const data: ScheduleFormDialogData = {
      courtId: this.courtId(),
      schedule: this.facade.schedule(),
    };
    this.dialog
      .open<ScheduleFormDialog, ScheduleFormDialogData, Schedule>(ScheduleFormDialog, { data })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.snackBar.open('Horario guardado.', 'OK', { duration: 4000 });
          void this.facade.getSchedule(this.courtId());
        }
      });
  }
}

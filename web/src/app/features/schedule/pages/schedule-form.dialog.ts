import { Component, PendingTasks, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import {
  DayOfWeek,
  IsoTime,
  Schedule,
  UpdateScheduleRequest,
  WeekdayHours,
} from '../../../shared/models';
import { DAYS, DAY_LABELS } from '../schedule-labels';
import { RangeDraft, SLOT_MINUTES_MAX, SLOT_MINUTES_MIN, rangeErrors } from '../schedule-rules';
import {
  SCHEDULE_FIELD_MESSAGES,
  ScheduleError,
  ScheduleFacade,
  ScheduleField,
} from '../schedule.facade';

export interface ScheduleFormDialogData {
  courtId: number;
  /** Current schedule, or null when the court has none yet. */
  schedule: Schedule | null;
}

type RangeGroup = FormGroup<{
  day: FormControl<DayOfWeek | null>;
  open: FormControl<IsoTime | null>;
  close: FormControl<IsoTime | null>;
}>;

const integer: ValidatorFn = (control: AbstractControl<number | null>) =>
  control.value === null || Number.isInteger(control.value) ? null : { integer: true };

const atMostTwoDecimals: ValidatorFn = (control: AbstractControl<number | null>) => {
  const value = control.value;
  return value === null || Math.abs(value * 100 - Math.round(value * 100)) < 1e-9
    ? null
    : { decimals: true };
};

/**
 * Edits a court's whole weekly schedule (slot length, slot price and opening ranges) and saves it with a PUT
 * through the facade. Applies the backend rules before sending; a rejected save keeps the dialog open with the
 * API message. Closes with the saved schedule, or empty on cancel.
 */
@Component({
  selector: 'app-schedule-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.schedule ? 'Editar horario' : 'Crear horario' }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <mat-dialog-content>
        <div class="row">
          <mat-form-field>
            <mat-label>Duración del turno (min)</mat-label>
            <input
              matInput
              type="number"
              formControlName="slotMinutes"
              min="30"
              max="240"
              step="30"
            />
            <mat-error>{{
              form.controls.slotMinutes.errors?.['server'] ?? fieldMessages.slotMinutes
            }}</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Precio por turno (€)</mat-label>
            <input matInput type="number" formControlName="price" min="0" step="0.01" />
            @if (form.controls.price.errors; as errors) {
              <mat-error>{{
                errors['server'] ??
                  (errors['required'] ? 'El precio es obligatorio.' : fieldMessages.price)
              }}</mat-error>
            }
          </mat-form-field>
        </div>

        <h3>Tramos de apertura</h3>
        @if (ranges.length === 0) {
          <p class="hint">Sin tramos: la pista estará cerrada toda la semana.</p>
        }
        <div formArrayName="ranges">
          @for (range of ranges.controls; track range; let i = $index) {
            <div class="range" [formGroupName]="i" data-testid="range">
              <div class="row">
                <mat-form-field>
                  <mat-label>Día</mat-label>
                  <mat-select formControlName="day">
                    @for (day of days; track day) {
                      <mat-option [value]="day">{{ dayLabels[day] }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field>
                  <mat-label>Apertura</mat-label>
                  <input matInput type="time" formControlName="open" />
                </mat-form-field>
                <mat-form-field>
                  <mat-label>Cierre</mat-label>
                  <input matInput type="time" formControlName="close" />
                </mat-form-field>
                <button
                  matIconButton
                  type="button"
                  (click)="removeRange(i)"
                  aria-label="Quitar tramo"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
              @if (submitted() && rangeError(i); as message) {
                <p class="failure" role="alert" data-testid="range-error">{{ message }}</p>
              }
            </div>
          }
        </div>
        <button matButton type="button" (click)="addRange()">
          <mat-icon>add</mat-icon> Añadir tramo
        </button>

        @if (failure(); as message) {
          <p class="failure" role="alert" data-testid="form-error">{{ message }}</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button matButton type="button" (click)="dialogRef.close()">Cancelar</button>
        <button matButton="filled" type="submit" [disabled]="saving()">Guardar</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    mat-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 560px;
    }
    .row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      flex-wrap: wrap;
    }
    h3 {
      margin: 8px 0 0;
    }
    .hint {
      color: var(--mat-sys-on-surface-variant);
      margin: 0;
    }
    .failure {
      color: var(--mat-sys-error);
      margin: 0 0 8px;
    }
  `,
})
export class ScheduleFormDialog {
  private readonly facade = inject(ScheduleFacade);
  private readonly pendingTasks = inject(PendingTasks);
  protected readonly dialogRef = inject(MatDialogRef<ScheduleFormDialog, Schedule>);
  protected readonly data = inject<ScheduleFormDialogData>(MAT_DIALOG_DATA);
  protected readonly days = DAYS;
  protected readonly dayLabels = DAY_LABELS;
  protected readonly fieldMessages = SCHEDULE_FIELD_MESSAGES;

  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  protected readonly failure = signal<string | null>(null);

  private readonly fb = inject(FormBuilder);
  protected readonly form = this.fb.group(
    {
      slotMinutes: this.fb.control<number | null>(this.data.schedule?.slotMinutes ?? 60, [
        Validators.required,
        Validators.min(SLOT_MINUTES_MIN),
        Validators.max(SLOT_MINUTES_MAX),
        integer,
      ]),
      price: this.fb.control<number | null>(this.data.schedule?.price ?? null, [
        Validators.required,
        Validators.min(0),
        atMostTwoDecimals,
      ]),
      ranges: this.fb.array<RangeGroup>(
        (this.data.schedule?.weekdays ?? []).map((range) => this.rangeGroup(range)),
      ),
    },
    { validators: (group) => this.validateRanges(group) },
  );

  protected get ranges(): FormArray<RangeGroup> {
    return this.form.controls.ranges;
  }

  protected addRange(): void {
    this.ranges.push(this.rangeGroup());
  }

  protected removeRange(index: number): void {
    this.ranges.removeAt(index);
  }

  protected rangeError(index: number): string | null {
    return (this.form.errors?.['ranges'] as (string | null)[] | undefined)?.[index] ?? null;
  }

  protected async submit(): Promise<void> {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.failure.set(null);
    const done = this.pendingTasks.add();
    try {
      this.dialogRef.close(await this.facade.updateSchedule(this.data.courtId, this.request()));
    } catch (error) {
      this.show(
        error instanceof ScheduleError
          ? error
          : new ScheduleError('No se pudo guardar el horario.'),
      );
    } finally {
      this.saving.set(false);
      done();
    }
  }

  private rangeGroup(range?: WeekdayHours): RangeGroup {
    return this.fb.group({
      day: this.fb.control<DayOfWeek | null>(range?.day ?? null),
      open: this.fb.control<IsoTime | null>(range?.open ?? null),
      close: this.fb.control<IsoTime | null>(range?.close ?? null),
    });
  }

  private validateRanges(group: AbstractControl): ValidationErrors | null {
    const { slotMinutes, ranges } = (group as typeof this.form).getRawValue();
    const slotValid = (group as typeof this.form).controls.slotMinutes.valid;
    const errors = rangeErrors(ranges as RangeDraft[], slotValid ? slotMinutes : null);
    return errors.some((error) => error !== null) ? { ranges: errors } : null;
  }

  /** Ranges in weekday order, then by opening time. */
  private request(): UpdateScheduleRequest {
    const { slotMinutes, price, ranges } = this.form.getRawValue();
    const weekdays = (ranges as WeekdayHours[])
      .map(({ day, open, close }) => ({ day, open, close }))
      .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.open.localeCompare(b.open));
    return { slotMinutes: slotMinutes!, price: price!, weekdays };
  }

  private show(error: ScheduleError): void {
    for (const [field, message] of Object.entries(error.fieldErrors) as [ScheduleField, string][]) {
      this.form.controls[field].setErrors({ server: message });
    }
    this.failure.set(error.message);
  }
}

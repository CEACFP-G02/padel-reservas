import { Component, PendingTasks, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { CourtBlock, CourtBlockRequest } from '../../../shared/models';
import { toIsoDate } from '../../../shared/util/date';
import {
  BLOCK_IN_THE_PAST,
  BlockField,
  CourtBlockError,
  CourtBlockFacade,
  END_AFTER_START,
} from '../courtblock.facade';

export interface BlockFormDialogData {
  courtId: number;
  courtName: string;
}

/** `end` must be after `start` (both `HH:mm`, so they compare as strings). */
function endAfterStart(group: AbstractControl): ValidationErrors | null {
  const { start, end } = group.value as { start: string; end: string };
  const endControl = group.get('end')!;
  const invalid = !!start && !!end && end <= start;
  const errors = { ...(endControl.errors ?? {}) };
  if (invalid) {
    errors['order'] = true;
  } else {
    delete errors['order'];
  }
  endControl.setErrors(Object.keys(errors).length ? errors : null);
  return null;
}

/**
 * Create-block modal: one date and a time range, plus an optional reason. Saves through the facade and closes
 * with the block; 400/409 from the API are shown inline and the modal stays open. Closes empty on cancel.
 */
@Component({
  selector: 'app-block-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Nuevo bloqueo · {{ data.courtName }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <mat-dialog-content>
        <mat-form-field>
          <mat-label>Fecha</mat-label>
          <input matInput [matDatepicker]="picker" [min]="today" formControlName="date" />
          <mat-datepicker-toggle matIconSuffix [for]="picker" />
          <mat-datepicker #picker />
          @if (form.controls.date.errors; as errors) {
            <mat-error>{{ errors['server'] ?? 'Indica la fecha.' }}</mat-error>
          }
        </mat-form-field>

        <div class="times">
          <mat-form-field>
            <mat-label>Desde</mat-label>
            <input matInput type="time" formControlName="start" />
            @if (form.controls.start.errors; as errors) {
              <mat-error>{{ errors['server'] ?? 'Indica la hora de inicio.' }}</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Hasta</mat-label>
            <input matInput type="time" formControlName="end" />
            @if (form.controls.end.errors; as errors) {
              <mat-error>{{
                errors['server'] ??
                  (errors['required'] ? 'Indica la hora de fin.' : endAfterStartMessage)
              }}</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-form-field>
          <mat-label>Motivo (opcional)</mat-label>
          <input matInput formControlName="reason" placeholder="Mantenimiento, torneo…" />
          @if (form.controls.reason.errors; as errors) {
            <mat-error>{{ errors['server'] ?? 'Máximo 255 caracteres.' }}</mat-error>
          }
        </mat-form-field>

        <p class="hint">Las reservas confirmadas impiden bloquear su horario.</p>

        @if (failure(); as message) {
          <p class="failure" role="alert" data-testid="form-error">{{ message }}</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button matButton type="button" (click)="dialogRef.close()">Cancelar</button>
        <button matButton="filled" type="submit" [disabled]="saving()">Bloquear</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    mat-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 320px;
    }
    .times {
      display: flex;
      gap: 12px;
    }
    .times mat-form-field {
      flex: 1;
    }
    .hint {
      color: var(--mat-sys-on-surface-variant);
      margin: 0;
    }
    .failure {
      color: var(--mat-sys-error);
      margin: 0;
    }
  `,
})
export class BlockFormDialog {
  private readonly facade = inject(CourtBlockFacade);
  private readonly pendingTasks = inject(PendingTasks);
  protected readonly dialogRef = inject(MatDialogRef<BlockFormDialog, CourtBlock>);
  protected readonly data = inject<BlockFormDialogData>(MAT_DIALOG_DATA);
  protected readonly endAfterStartMessage = END_AFTER_START;

  /** Today at midnight: earlier days cannot be picked. */
  protected readonly today = (() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  })();

  protected readonly saving = signal(false);
  protected readonly failure = signal<string | null>(null);

  private readonly fb = inject(FormBuilder);
  protected readonly form = this.fb.group(
    {
      date: this.fb.control<Date | null>(null, Validators.required),
      start: this.fb.nonNullable.control('', Validators.required),
      end: this.fb.nonNullable.control('', Validators.required),
      reason: this.fb.nonNullable.control('', Validators.maxLength(255)),
    },
    { validators: endAfterStart },
  );

  protected async submit(): Promise<void> {
    this.form.markAllAsTouched();
    this.failure.set(null);
    if (this.form.invalid || this.saving()) {
      return;
    }
    const request = this.request();
    if (this.hasEnded(request)) {
      this.failure.set(BLOCK_IN_THE_PAST);
      return;
    }

    this.saving.set(true);
    const done = this.pendingTasks.add();
    try {
      this.dialogRef.close(await this.facade.createBlock(this.data.courtId, request));
    } catch (error) {
      this.show(
        error instanceof CourtBlockError
          ? error
          : new CourtBlockError('No se pudo crear el bloqueo.'),
      );
    } finally {
      this.saving.set(false);
      done();
    }
  }

  private request(): CourtBlockRequest {
    const { date, start, end, reason } = this.form.getRawValue();
    const request: CourtBlockRequest = { date: toIsoDate(date!), start, end };
    return reason.trim() ? { ...request, reason: reason.trim() } : request;
  }

  private hasEnded({ date, end }: CourtBlockRequest): boolean {
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = end.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes) <= new Date();
  }

  private show(error: CourtBlockError): void {
    const fields = Object.entries(error.fieldErrors) as [BlockField, string][];
    for (const [field, message] of fields) {
      this.form.controls[field].setErrors({ server: message });
    }
    this.failure.set(fields.length ? null : error.message);
  }
}

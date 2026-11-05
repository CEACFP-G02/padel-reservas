import { Component, PendingTasks, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';

import { Court, CourtRequest, CourtType, UpdateCourtRequest } from '../../../shared/models';
import { COURT_TYPE_LABELS } from '../court-labels';
import { CourtError, CourtFacade, CourtField } from '../court.facade';

const NAME_MAX_LENGTH = 100;

function notBlank(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim() ? null : { required: true };
}

/**
 * Create (data = null) or edit (data = court) modal. It saves through the facade and closes with the saved
 * court; it stays open on errors, showing a duplicate name (409) on the name field. Closes empty on cancel.
 */
@Component({
  selector: 'app-court-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatCheckboxModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ court ? 'Editar pista' : 'Nueva pista' }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <mat-dialog-content>
        <mat-form-field>
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" />
          @if (form.controls.name.errors; as errors) {
            <mat-error>
              {{
                errors['server'] ??
                  (errors['required'] ? 'El nombre es obligatorio.' : 'Máximo 100 caracteres.')
              }}
            </mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label>Tipo</mat-label>
          <mat-select formControlName="type">
            @for (type of types; track type) {
              <mat-option [value]="type">{{ typeLabels[type] }}</mat-option>
            }
          </mat-select>
          <mat-error>{{
            form.controls.type.errors?.['server'] ?? 'Elige el tipo de pista.'
          }}</mat-error>
        </mat-form-field>

        <mat-radio-group formControlName="indoor" aria-label="Cubierta o exterior">
          <mat-radio-button [value]="true">Cubierta</mat-radio-button>
          <mat-radio-button [value]="false">Exterior</mat-radio-button>
        </mat-radio-group>
        @if (form.controls.indoor.invalid && form.controls.indoor.touched) {
          <mat-error data-testid="indoor-error">
            {{
              form.controls.indoor.errors?.['server'] ??
                'Indica si la pista es cubierta o exterior.'
            }}
          </mat-error>
        }

        <mat-checkbox formControlName="active">Activa</mat-checkbox>

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
      min-width: 320px;
    }
    mat-radio-group {
      display: flex;
      gap: 16px;
    }
    .failure {
      color: var(--mat-sys-error);
      margin: 0;
    }
  `,
})
export class CourtFormDialog {
  private readonly facade = inject(CourtFacade);
  private readonly pendingTasks = inject(PendingTasks);
  protected readonly dialogRef = inject(MatDialogRef<CourtFormDialog, Court>);
  protected readonly court = inject<Court | null>(MAT_DIALOG_DATA, { optional: true });
  protected readonly types = Object.values(CourtType);
  protected readonly typeLabels = COURT_TYPE_LABELS;

  protected readonly saving = signal(false);
  protected readonly failure = signal<string | null>(null);

  private readonly fb = inject(FormBuilder);
  protected readonly form = this.fb.group({
    name: this.fb.nonNullable.control(this.court?.name ?? '', [
      notBlank,
      Validators.maxLength(NAME_MAX_LENGTH),
    ]),
    type: this.fb.control<CourtType | null>(this.court?.type ?? null, Validators.required),
    indoor: this.fb.control<boolean | null>(this.court?.indoor ?? null, Validators.required),
    active: this.fb.nonNullable.control(this.court?.active ?? true),
  });

  protected async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) {
      return;
    }
    const request = this.request();
    const changes = this.court ? this.changesTo(this.court, request) : request;
    if (this.court && Object.keys(changes).length === 0) {
      this.dialogRef.close();
      return;
    }

    this.saving.set(true);
    this.failure.set(null);
    const done = this.pendingTasks.add();
    try {
      const saved = this.court
        ? await this.facade.updateCourt(this.court.id, changes)
        : await this.facade.createCourt(request);
      this.dialogRef.close(saved);
    } catch (error) {
      this.show(
        error instanceof CourtError ? error : new CourtError('No se pudo guardar la pista.'),
      );
    } finally {
      this.saving.set(false);
      done();
    }
  }

  private request(): CourtRequest {
    const { name, type, indoor, active } = this.form.getRawValue();
    return { name: name.trim(), type: type!, indoor: indoor!, active };
  }

  private changesTo(court: Court, request: CourtRequest): UpdateCourtRequest {
    return Object.fromEntries(
      (Object.keys(request) as CourtField[])
        .filter((field) => request[field] !== court[field])
        .map((field) => [field, request[field]]),
    );
  }

  private show(error: CourtError): void {
    const fields = Object.entries(error.fieldErrors) as [CourtField, string][];
    for (const [field, message] of fields) {
      this.form.controls[field].setErrors({ server: message });
    }
    this.failure.set(fields.length ? null : error.message);
  }
}

import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Court, CourtRequest, CourtType } from '../../../shared/models';
import { COURT_TYPE_LABELS } from '../court-labels';

/** Create (no data) or edit (data = court) dialog. Closes with a CourtRequest (also valid as a PATCH body). */
@Component({
  selector: 'app-court-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ court ? 'Editar pista' : 'Nueva pista' }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <mat-form-field>
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Tipo</mat-label>
          <mat-select formControlName="type">
            @for (type of types; track type) {
              <mat-option [value]="type">{{ typeLabels[type] }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-checkbox formControlName="indoor">Cubierta</mat-checkbox>
        <mat-checkbox formControlName="active">Activa</mat-checkbox>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button matButton mat-dialog-close type="button">Cancelar</button>
        <button matButton="filled" type="submit" [disabled]="form.invalid">Guardar</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `mat-dialog-content { display: flex; flex-direction: column; min-width: 320px; }`,
})
export class CourtFormDialog {
  private readonly dialogRef = inject(MatDialogRef<CourtFormDialog, CourtRequest>);
  protected readonly court = inject<Court | null>(MAT_DIALOG_DATA, { optional: true });
  protected readonly types = Object.values(CourtType);
  protected readonly typeLabels = COURT_TYPE_LABELS;

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: [this.court?.name ?? '', [Validators.required, Validators.maxLength(100)]],
    type: [this.court?.type ?? CourtType.GLASS, Validators.required],
    indoor: [this.court?.indoor ?? false],
    active: [this.court?.active ?? true],
  });

  protected submit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.getRawValue());
    }
  }
}

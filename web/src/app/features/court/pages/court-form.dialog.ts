import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Court, CourtRequest, CourtType } from '../../../shared/models';

/** Create (no data) or edit (data = court) dialog. Closes with a CourtRequest. */
@Component({
  selector: 'app-court-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
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
              <mat-option [value]="type">{{ type }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Precio / hora (€)</mat-label>
          <input matInput type="number" min="0" step="0.5" formControlName="pricePerHour" />
        </mat-form-field>
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

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: [this.court?.name ?? '', [Validators.required, Validators.maxLength(100)]],
    type: [this.court?.type ?? CourtType.INDOOR, Validators.required],
    pricePerHour: [this.court?.pricePerHour ?? 0, [Validators.required, Validators.min(0)]],
  });

  protected submit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.getRawValue());
    }
  }
}

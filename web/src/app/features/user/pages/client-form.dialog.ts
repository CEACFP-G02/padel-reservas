import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { User } from '../../../shared/models';

/** Create (no data) or edit (data = client) dialog. */
@Component({
  selector: 'app-client-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ client ? 'Editar cliente' : 'Nuevo cliente' }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        @if (!client) {
          <mat-form-field>
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Contraseña</mat-label>
            <input matInput type="password" formControlName="password" />
          </mat-form-field>
        }
        <mat-form-field>
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="firstName" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Apellidos</mat-label>
          <input matInput formControlName="lastName" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Teléfono</mat-label>
          <input matInput formControlName="phone" />
        </mat-form-field>
        @if (client) {
          <mat-checkbox formControlName="active">Activo</mat-checkbox>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button matButton mat-dialog-close type="button">Cancelar</button>
        <button matButton="filled" type="submit" [disabled]="form.invalid">Guardar</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `mat-dialog-content { display: flex; flex-direction: column; min-width: 320px; }`,
})
export class ClientFormDialog {
  protected readonly client = inject<User | null>(MAT_DIALOG_DATA, { optional: true });

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', this.client ? [] : [Validators.required, Validators.email]],
    password: ['', this.client ? [] : [Validators.required, Validators.minLength(8)]],
    firstName: [this.client?.firstName ?? '', Validators.required],
    lastName: [this.client?.lastName ?? '', Validators.required],
    phone: [this.client?.phone ?? ''],
    active: [this.client?.active ?? true],
  });

  protected submit(): void {
    // TODO: close with CreateClientRequest / UpdateClientRequest built from the form — see docs/api.md#post-apiv1users
  }
}

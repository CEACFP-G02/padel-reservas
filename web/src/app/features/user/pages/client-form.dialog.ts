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

import { Client, CreateClientRequest, UpdateClientRequest } from '../../../shared/models';
import { ClientError, ClientField, UserFacade } from '../user.facade';

function notBlank(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim() ? null : { required: true };
}

/** `Validators.email` on the trimmed value (the API trims emails too). */
function email(control: AbstractControl<string>): ValidationErrors | null {
  const value = control.value.trim();
  return value ? Validators.email({ value } as AbstractControl) : null;
}

/**
 * Create (data = null) or edit (data = client) modal. It saves through the facade and closes with the saved
 * client; it stays open on errors, showing 400/409 on their fields. Closes empty on cancel.
 */
@Component({
  selector: 'app-client-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ client ? 'Editar cliente' : 'Nuevo cliente' }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <mat-dialog-content>
        <mat-form-field>
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" />
          @if (form.controls.name.errors; as errors) {
            <mat-error>{{
              errors['server'] ??
                (errors['required'] ? 'El nombre es obligatorio.' : 'Máximo 200 caracteres.')
            }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" />
          @if (form.controls.email.errors; as errors) {
            <mat-error>{{
              errors['server'] ??
                (errors['required'] ? 'El email es obligatorio.' : 'Introduce un email válido.')
            }}</mat-error>
          }
        </mat-form-field>

        @if (!client) {
          <mat-form-field>
            <mat-label>Contraseña</mat-label>
            <input
              matInput
              type="password"
              formControlName="password"
              autocomplete="new-password"
            />
            <mat-hint>El cliente la usará para entrar en la app.</mat-hint>
            @if (form.controls.password.errors; as errors) {
              <mat-error>{{
                errors['server'] ??
                  (errors['required']
                    ? 'La contraseña es obligatoria.'
                    : errors['minlength']
                      ? 'Mínimo 8 caracteres.'
                      : 'Máximo 72 caracteres.')
              }}</mat-error>
            }
          </mat-form-field>
        }

        <mat-form-field>
          <mat-label>Teléfono</mat-label>
          <input matInput type="tel" formControlName="phone" />
          @if (form.controls.phone.errors; as errors) {
            <mat-error>{{ errors['server'] ?? 'Máximo 30 caracteres.' }}</mat-error>
          }
        </mat-form-field>

        @if (client) {
          <mat-checkbox formControlName="active">Activo</mat-checkbox>
        }

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
    .failure {
      color: var(--mat-sys-error);
      margin: 0;
    }
  `,
})
export class ClientFormDialog {
  private readonly facade = inject(UserFacade);
  private readonly pendingTasks = inject(PendingTasks);
  protected readonly dialogRef = inject(MatDialogRef<ClientFormDialog, Client>);
  protected readonly client = inject<Client | null>(MAT_DIALOG_DATA, { optional: true });

  protected readonly saving = signal(false);
  protected readonly failure = signal<string | null>(null);

  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly form = this.fb.group({
    name: [this.client?.name ?? '', [notBlank, Validators.maxLength(200)]],
    email: [this.client?.email ?? '', [notBlank, email]],
    password: [
      '',
      this.client ? [] : [notBlank, Validators.minLength(8), Validators.maxLength(72)],
    ],
    phone: [this.client?.phone ?? '', [Validators.maxLength(30)]],
    active: [this.client?.active ?? true],
  });

  protected async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) {
      return;
    }
    const changes = this.client ? this.changesTo(this.client) : null;
    if (changes && Object.keys(changes).length === 0) {
      this.dialogRef.close();
      return;
    }

    this.saving.set(true);
    this.failure.set(null);
    const done = this.pendingTasks.add();
    try {
      const saved = this.client
        ? await this.facade.updateClient(this.client.id, changes!)
        : await this.facade.createClient(this.createRequest());
      this.dialogRef.close(saved);
    } catch (error) {
      this.show(
        error instanceof ClientError ? error : new ClientError('No se pudo guardar el cliente.'),
      );
    } finally {
      this.saving.set(false);
      done();
    }
  }

  private createRequest(): CreateClientRequest {
    const { name, email, password, phone } = this.form.getRawValue();
    const request: CreateClientRequest = { name: name.trim(), email: email.trim(), password };
    return phone.trim() ? { ...request, phone: phone.trim() } : request;
  }

  /** Only what differs from the client; an emptied phone is sent as `''` (the API clears it). */
  private changesTo(client: Client): UpdateClientRequest {
    const { name, email, phone, active } = this.form.getRawValue();
    const changes: UpdateClientRequest = {};
    if (name.trim() !== client.name) changes.name = name.trim();
    if (email.trim() !== client.email) changes.email = email.trim();
    if (phone.trim() !== (client.phone ?? '')) changes.phone = phone.trim();
    if (active !== client.active) changes.active = active;
    return changes;
  }

  private show(error: ClientError): void {
    const fields = Object.entries(error.fieldErrors) as [ClientField, string][];
    for (const [field, message] of fields) {
      this.form.controls[field].setErrors({ server: message });
    }
    this.failure.set(fields.length ? null : error.message);
  }
}

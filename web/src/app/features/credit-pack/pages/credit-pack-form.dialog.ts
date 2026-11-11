import { CurrencyPipe } from '@angular/common';
import { Component, PendingTasks, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { CreditPack } from '../../../shared/models';
import {
  CreditPackError,
  CreditPackFacade,
  CreditPackRow,
  PRICE_RULE,
  pricePerReservation,
} from '../credit-pack.facade';

/** docs/api.md: DECIMAL(8,2). */
const PRICE_MAX = 999999.99;

const atMostTwoDecimals: ValidatorFn = (control: AbstractControl<number | null>) => {
  const value = control.value;
  return value === null || Math.abs(value * 100 - Math.round(value * 100)) < 1e-9
    ? null
    : { decimals: true };
};

/**
 * Edits a credit pack's price (its size is read-only). Saves through the facade and closes with the saved pack;
 * stays open on errors, showing an API 400 on the price field. Closes empty on cancel or when nothing changed.
 */
@Component({
  selector: 'app-credit-pack-form-dialog',
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Editar precio del pack</h2>
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <mat-dialog-content>
        <p class="size">
          <span class="muted">Tamaño</span>
          <strong data-testid="size">{{ pack.size }} reservas</strong>
        </p>

        <mat-form-field>
          <mat-label>Precio del pack (€)</mat-label>
          <input matInput type="number" formControlName="price" min="0" step="0.01" />
          @if (form.controls.price.errors; as errors) {
            <mat-error>
              {{
                errors['server'] ??
                  (errors['required']
                    ? 'El precio es obligatorio.'
                    : errors['max']
                      ? 'El precio no puede superar 999.999,99 €.'
                      : priceRule)
              }}
            </mat-error>
          }
          @if (perReservation(); as perReservation) {
            <mat-hint data-testid="per-reservation"
              >{{ perReservation | currency: 'EUR' }} por reserva</mat-hint
            >
          }
        </mat-form-field>

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
    .size {
      display: flex;
      justify-content: space-between;
      margin: 0 0 8px;
    }
    .failure {
      margin: 0;
    }
  `,
})
export class CreditPackFormDialog {
  private readonly facade = inject(CreditPackFacade);
  private readonly pendingTasks = inject(PendingTasks);
  protected readonly dialogRef = inject(MatDialogRef<CreditPackFormDialog, CreditPack>);
  protected readonly pack = inject<CreditPackRow>(MAT_DIALOG_DATA);
  protected readonly priceRule = PRICE_RULE;

  protected readonly saving = signal(false);
  protected readonly failure = signal<string | null>(null);

  private readonly fb = inject(FormBuilder);
  protected readonly form = this.fb.group({
    price: this.fb.control<number | null>(this.pack.price, [
      Validators.required,
      Validators.min(0),
      Validators.max(PRICE_MAX),
      atMostTwoDecimals,
    ]),
  });

  private readonly price = toSignal(this.form.controls.price.valueChanges, {
    initialValue: this.pack.price,
  });
  protected readonly perReservation = computed(() => {
    const price = this.price();
    return price === null || price < 0 ? null : pricePerReservation(price, this.pack.size);
  });

  protected async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) {
      return;
    }
    const price = this.form.controls.price.value!;
    if (price === this.pack.price) {
      this.dialogRef.close();
      return;
    }

    this.saving.set(true);
    this.failure.set(null);
    const done = this.pendingTasks.add();
    try {
      this.dialogRef.close(await this.facade.updatePrice(this.pack.id, price));
    } catch (error) {
      this.show(
        error instanceof CreditPackError
          ? error
          : new CreditPackError('No se pudo guardar el precio.'),
      );
    } finally {
      this.saving.set(false);
      done();
    }
  }

  private show(error: CreditPackError): void {
    if (error.fieldErrors.price) {
      this.form.controls.price.setErrors({ server: error.fieldErrors.price });
      this.failure.set(null);
    } else {
      this.failure.set(error.message);
    }
  }
}

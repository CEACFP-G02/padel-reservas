import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { Booking } from '../../../shared/models';

/** Manual booking (no data) or reschedule (data = booking). */
@Component({
  selector: 'app-booking-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ booking ? 'Reprogramar reserva #' + booking.id : 'Nueva reserva manual' }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        @if (!booking) {
          <mat-form-field>
            <mat-label>ID cliente</mat-label>
            <input matInput type="number" formControlName="clientId" />
          </mat-form-field>
        }
        <mat-form-field>
          <mat-label>ID pista</mat-label>
          <input matInput type="number" formControlName="courtId" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Fecha</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="date" />
          <mat-datepicker-toggle matIconSuffix [for]="picker" />
          <mat-datepicker #picker />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Inicio</mat-label>
          <input matInput type="time" formControlName="start" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Fin</mat-label>
          <input matInput type="time" formControlName="end" />
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
export class BookingFormDialog {
  protected readonly booking = inject<Booking | null>(MAT_DIALOG_DATA, { optional: true });

  protected readonly form = inject(FormBuilder).group({
    clientId: [null as number | null, this.booking ? [] : [Validators.required]],
    courtId: [this.booking?.courtId ?? null, Validators.required],
    date: [null as Date | null, Validators.required],
    start: ['', Validators.required],
    end: ['', Validators.required],
  });

  protected submit(): void {
    // TODO: build CreateBookingRequest { courtId, date: toIsoDate, slots: [{ start, end }] (HH:mm), clientId } /
    //  RescheduleBookingRequest and close with it; pick the court from a slot's free courtIds
    //  (AvailabilityApi.search) instead of a raw id — see docs/api.md#bookings--apiv1bookings
  }
}

import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, PendingTasks, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { Booking, Client, IsoDate, IsoTime } from '../../../shared/models';
import { ScheduleFacade } from '../../schedule/schedule.facade';
import { UserFacade } from '../../user/user.facade';
import { BookingError, BookingFacade } from '../booking.facade';

/** The free slot of the occupancy calendar to book. */
export interface ManualBookingDialogData {
  courtId: number;
  courtName: string;
  date: IsoDate;
  start: IsoTime;
  end: IsoTime;
}

const CLIENTS_PAGE = 20;

/**
 * Owner books one free slot for a client. Closes with the booking; on 409/400 it stays open showing the
 * reason. Closes empty on cancel.
 */
@Component({
  selector: 'app-manual-booking-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    CurrencyPipe,
    DatePipe,
  ],
  template: `
    <h2 mat-dialog-title>Reserva manual</h2>
    <mat-dialog-content>
      <dl class="slot">
        <dt>Pista</dt>
        <dd data-testid="slot-court">{{ data.courtName }}</dd>
        <dt>Fecha</dt>
        <dd data-testid="slot-date">{{ data.date | date: 'fullDate' }}</dd>
        <dt>Hora</dt>
        <dd data-testid="slot-time">{{ data.start }} – {{ data.end }}</dd>
        <dt>Precio</dt>
        <dd data-testid="slot-price">
          @if (schedules.schedule(); as schedule) {
            {{ schedule.price | currency: 'EUR' }}
          } @else {
            —
          }
        </dd>
      </dl>

      <mat-form-field class="search">
        <mat-label>Buscar cliente por nombre o email</mat-label>
        <input matInput #query data-testid="client-search" (keyup.enter)="search(query.value)" />
        <button
          matIconButton
          matSuffix
          type="button"
          (click)="search(query.value)"
          aria-label="Buscar"
        >
          <mat-icon>search</mat-icon>
        </button>
      </mat-form-field>

      @if (users.loading()) {
        <mat-progress-bar mode="indeterminate" />
      }
      @if (users.error(); as error) {
        <p class="failure" role="alert">{{ error }}</p>
      }

      @if (activeClients().length) {
        <mat-selection-list
          [multiple]="false"
          (selectionChange)="pick($event)"
          aria-label="Clientes"
        >
          @for (client of activeClients(); track client.id) {
            <mat-list-option [value]="client" [selected]="client.id === selected()?.id">
              <span matListItemTitle>{{ client.name }}</span>
              <span matListItemLine>{{ client.email }}</span>
            </mat-list-option>
          }
        </mat-selection-list>
      } @else if (!users.loading()) {
        <p class="muted">No hay clientes activos que coincidan.</p>
      }

      @if (selected(); as client) {
        <p data-testid="selected-client">
          Reserva para <strong>{{ client.name }}</strong>
        </p>
      }
      @if (failure(); as message) {
        <p class="failure" role="alert" data-testid="booking-error">{{ message }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton type="button" (click)="dialogRef.close()">Cancelar</button>
      <button
        matButton="filled"
        type="button"
        [disabled]="!selected() || saving()"
        (click)="confirm()"
      >
        Reservar
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 360px;
    }
    .slot {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 4px 16px;
      margin: 0;
    }
    .slot dt {
      color: var(--mat-sys-on-surface-variant);
    }
    .slot dd {
      margin: 0;
    }
    .slot dd[data-testid='slot-date']::first-letter {
      text-transform: uppercase;
    }
    .muted {
      color: var(--mat-sys-on-surface-variant);
    }
    .failure {
      color: var(--mat-sys-error);
      margin: 0;
    }
    mat-selection-list {
      max-height: 240px;
      overflow: auto;
    }
  `,
})
export class ManualBookingDialog {
  protected readonly users = inject(UserFacade);
  protected readonly schedules = inject(ScheduleFacade);
  private readonly bookings = inject(BookingFacade);
  private readonly pendingTasks = inject(PendingTasks);
  protected readonly dialogRef = inject(MatDialogRef<ManualBookingDialog, Booking>);
  protected readonly data = inject<ManualBookingDialogData>(MAT_DIALOG_DATA);

  /** Inactive clients cannot be booked for (the API answers 400), so they are not offered. */
  protected readonly activeClients = computed(() =>
    this.users.clients().filter((client) => client.active),
  );
  protected readonly selected = signal<Client | null>(null);
  protected readonly saving = signal(false);
  protected readonly failure = signal<string | null>(null);
  /** A booking attempt hit a 409: whoever opened the dialog should refresh its view of the slot. */
  readonly slotTaken = signal(false);

  constructor() {
    void this.schedules.getSchedule(this.data.courtId);
    void this.users.listClients({ size: CLIENTS_PAGE });
  }

  protected search(value: string): void {
    const search = value.trim();
    void this.users.listClients(search ? { search, size: CLIENTS_PAGE } : { size: CLIENTS_PAGE });
  }

  protected pick(event: MatSelectionListChange): void {
    this.selected.set((event.options[0]?.value as Client | undefined) ?? null);
    this.failure.set(null);
  }

  protected async confirm(): Promise<void> {
    const client = this.selected();
    if (!client || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.failure.set(null);
    const done = this.pendingTasks.add();
    try {
      const { courtId, date, start, end } = this.data;
      const booking = await this.bookings.createBooking({
        courtId,
        date,
        slots: [{ start, end }],
        clientId: client.id,
      });
      this.dialogRef.close(booking);
    } catch (error) {
      this.failure.set(
        error instanceof BookingError ? error.message : 'No se pudo crear la reserva.',
      );
      if (error instanceof BookingError && error.slotTaken) {
        this.slotTaken.set(true);
      }
    } finally {
      this.saving.set(false);
      done();
    }
  }
}

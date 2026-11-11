import { CurrencyPipe, PercentPipe } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Booking, BookingStatus, IsoDate } from '../../../shared/models';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/ui/confirm-dialog/confirm.dialog';
import { toIsoDate } from '../../../shared/util/date';
import { BookingError, BookingFacade } from '../../booking/booking.facade';
import { CourtFacade } from '../../court/court.facade';
import { AvailabilityFacade } from '../availability.facade';
import { occupancyGrid } from '../occupancy-grid';

const SNACK_DURATION = { duration: 4000 };

/** `07:00 – 09:00` for a booking of consecutive slots. */
function bookingRange(booking: Booking): string {
  const starts = booking.slots.map((slot) => slot.start).sort();
  const ends = booking.slots.map((slot) => slot.end).sort();
  return `${starts[0]} – ${ends[ends.length - 1]}`;
}

/** Admin occupancy calendar: pick a court and a day (past days too), see and cancel its bookings. */
@Component({
  selector: 'app-availability-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatSelectModule,
    CurrencyPipe,
    PercentPipe,
  ],
  template: `
    <h1>Ocupación de pistas</h1>

    <div class="layout">
      <mat-card class="calendar" appearance="outlined">
        <mat-calendar [selected]="date()" (selectedChange)="date.set($event)" />
      </mat-card>

      <section class="grid-panel">
        @if (courts.courts().length) {
          <mat-form-field>
            <mat-label>Pista</mat-label>
            <mat-select [value]="selectedCourtId()" (valueChange)="courtId.set($event)">
              @for (court of courts.courts(); track court.id) {
                <mat-option [value]="court.id"
                  >{{ court.name }}{{ court.active ? '' : ' (inactiva)' }}</mat-option
                >
              }
            </mat-select>
          </mat-form-field>
        } @else {
          <p class="muted">Todavía no hay pistas.</p>
        }

        @if (availability.loading() || bookings.loading()) {
          <mat-progress-bar mode="indeterminate" />
        }

        @if (availability.error() || bookings.error()) {
          <div class="error" role="alert" data-testid="load-error">
            @if (availability.error(); as error) {
              <p>{{ error }}</p>
            }
            @if (bookings.error(); as error) {
              <p>{{ error }}</p>
            }
          </div>
        }

        @if (availability.dayAvailability()) {
          @if (grid().length) {
            <p data-testid="occupancy">Ocupación: {{ availability.occupancy() | percent }}</p>
            <div class="slots">
              @for (cell of grid(); track cell.start) {
                <div class="slot" [class]="cell.state" data-testid="slot">
                  <span class="time">{{ cell.start }} – {{ cell.end }}</span>
                  @switch (cell.state) {
                    @case ('free') {
                      <span class="state">Libre</span>
                    }
                    @case ('unavailable') {
                      <span class="state">No disponible</span>
                    }
                    @case ('booked') {
                      <span class="state">Reservada</span>
                      @if (cell.booking; as booking) {
                        <strong>{{ booking.userName }}</strong>
                        <span class="detail"
                          >Reserva {{ range(booking) }} · {{ cell.price | currency: 'EUR' }}</span
                        >
                        @if (booking.status === confirmed) {
                          <button
                            matButton
                            type="button"
                            data-testid="cancel-booking"
                            (click)="cancel(booking)"
                          >
                            Cancelar reserva
                          </button>
                        }
                      }
                    }
                  }
                </div>
              }
            </div>
          } @else {
            <p class="muted">La pista no abre este día o no tiene horario.</p>
          }
        }
      </section>
    </div>
  `,
  styles: `
    .layout {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
    }
    .calendar {
      width: 320px;
    }
    .grid-panel {
      flex: 1;
      min-width: 280px;
    }
    .muted {
      color: var(--mat-sys-on-surface-variant);
    }
    .error {
      color: var(--mat-sys-error);
    }
    .slots {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 8px;
    }
    .slot {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px;
      border-radius: 8px;
    }
    .slot.free {
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }
    .slot.booked {
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
    }
    .slot.unavailable {
      background: var(--mat-sys-surface-container-highest);
      color: var(--mat-sys-on-surface-variant);
    }
    .time {
      font-weight: 500;
    }
    .slot button {
      align-self: flex-start;
    }
  `,
})
export class AvailabilityPage {
  protected readonly availability = inject(AvailabilityFacade);
  protected readonly bookings = inject(BookingFacade);
  protected readonly courts = inject(CourtFacade);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly confirmed = BookingStatus.CONFIRMED;

  protected readonly date = signal(new Date());
  /** The court picked by the owner; until then, the first court. */
  protected readonly courtId = signal<number | null>(null);
  protected readonly selectedCourtId = computed(
    () => this.courtId() ?? this.courts.courts()[0]?.id ?? null,
  );
  protected readonly grid = computed(() => {
    const day = this.availability.dayAvailability();
    return day ? occupancyGrid(day, this.bookings.bookings()) : [];
  });

  constructor() {
    // Every court, inactive ones too, so the owner can look back at their history.
    void this.courts.listCourts({ size: 100 });
    effect(() => {
      const courtId = this.selectedCourtId();
      const date = toIsoDate(this.date());
      if (courtId != null) {
        untracked(() => void this.load(courtId, date));
      }
    });
  }

  protected range(booking: Booking): string {
    return bookingRange(booking);
  }

  protected cancel(booking: Booking): void {
    const data: ConfirmDialogData = {
      title: 'Cancelar reserva',
      message: `Se cancelará la reserva de ${booking.userName} en ${booking.courtName} el ${booking.date} (${bookingRange(booking)}). Sus turnos quedarán libres.`,
      confirmLabel: 'Cancelar reserva',
    };
    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, { data })
      .afterClosed()
      .subscribe(async (confirmed) => {
        if (!confirmed) {
          return;
        }
        try {
          await this.bookings.cancelBooking(booking.id);
          this.notify('Reserva cancelada.');
        } catch (error) {
          this.notify(
            error instanceof BookingError ? error.message : 'No se pudo cancelar la reserva.',
          );
        }
        await this.reload();
      });
  }

  private reload(): Promise<void> {
    const courtId = this.selectedCourtId();
    return courtId == null ? Promise.resolve() : this.load(courtId, toIsoDate(this.date()));
  }

  private async load(courtId: number, date: IsoDate): Promise<void> {
    await Promise.all([
      this.availability.getCourtDayAvailability(courtId, date),
      this.bookings.listBookings({ date, courtId, size: 100 }),
    ]);
  }

  private notify(message: string): void {
    this.snackBar.open(message, 'OK', SNACK_DURATION);
  }
}

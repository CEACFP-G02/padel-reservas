import { PercentPipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { toIsoDate } from '../../../shared/util/date';
import { CourtFacade } from '../../court/court.facade';
import { AvailabilityFacade } from '../availability.facade';

/** Admin calendar: pick a court and a day, see the occupancy grid. */
@Component({
  selector: 'app-availability-page',
  imports: [MatCardModule, MatDatepickerModule, MatFormFieldModule, MatSelectModule, PercentPipe],
  template: `
    <h1>Disponibilidad</h1>

    <div class="layout">
      <mat-card class="calendar">
        <mat-calendar [selected]="date()" (selectedChange)="date.set($event)" />
      </mat-card>

      <section class="grid-panel">
        <mat-form-field>
          <mat-label>Pista</mat-label>
          <mat-select [value]="courtId()" (valueChange)="courtId.set($event)">
            @for (court of courts.activeCourts(); track court.id) {
              <mat-option [value]="court.id">{{ court.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (facade.dayAvailability(); as day) {
          <p>Ocupación: {{ facade.occupancy() | percent }}</p>
          <div class="slots">
            @for (slot of day.slots; track slot.start) {
              <div class="slot" [class.taken]="!slot.available">{{ slot.start }} – {{ slot.end }}</div>
            }
          </div>
        } @else {
          <p>Selecciona una pista y un día.</p>
        }
      </section>
    </div>
  `,
  styles: `
    .layout { display: flex; flex-wrap: wrap; gap: 24px; }
    .calendar { width: 320px; }
    .grid-panel { flex: 1; min-width: 280px; }
    .slots { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
    .slot { padding: 8px; border-radius: 8px; background: var(--mat-sys-primary-container); }
    .slot.taken { background: var(--mat-sys-error-container); }
  `,
})
export class AvailabilityPage {
  protected readonly facade = inject(AvailabilityFacade);
  protected readonly courts = inject(CourtFacade);
  protected readonly date = signal(new Date());
  protected readonly courtId = signal<number | null>(null);

  constructor() {
    void this.courts.listCourts({ active: true, size: 100 });
    effect(() => {
      const courtId = this.courtId();
      if (courtId != null) {
        void this.facade.getCourtDayAvailability(courtId, toIsoDate(this.date()));
      }
    });
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonDatetime,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircleOutline, calendarClearOutline, calendarOutline, tennisballOutline, timeOutline } from 'ionicons/icons';

import { Booking, IsoDate, SlotResponse } from '../../../shared/models';
import { toIsoDate } from '../../../shared/util/date';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { formatDay, formatPrice } from '../../../shared/util/format';
import { BookingConfirmModalComponent } from '../../booking/components/booking-confirm.modal';
import { BookingFacade } from '../../booking/booking.facade';
import { AvailabilityFacade } from '../availability.facade';

addIcons({ alertCircleOutline, calendarClearOutline, calendarOutline, tennisballOutline, timeOutline });

/** Headline screen: date + number of courts → free slots, or nearby days when the day is full; tap a slot to book. */
@Component({
  selector: 'app-availability-search',
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonText,
    IonChip,
    IonDatetime,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonIcon,
    EmptyStateComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Reservar</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="courts">Pistas</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="page">
      <section class="search-card" aria-label="Buscar">
      <ion-datetime
        presentation="date"
        locale="es-ES"
        [firstDayOfWeek]="1"
        [min]="today"
        [value]="date()"
        (ionChange)="onDateChange($event.detail.value)"
      />

      <ion-list lines="none" class="courts-picker">
        <ion-item>
          <ion-icon slot="start" name="tennisball-outline" color="primary" aria-hidden="true" />
          <ion-select label="Pistas a la vez" [value]="courts()" (ionChange)="courts.set($event.detail.value)">
            @for (n of courtOptions; track n) {
              <ion-select-option [value]="n">{{ n }}</ion-select-option>
            }
          </ion-select>
        </ion-item>
      </ion-list>

      <ion-button expand="block" data-testid="search" (click)="search()" [disabled]="facade.loading()">Buscar</ion-button>
      </section>

      @if (facade.loading()) {
        <div class="state-loading"><ion-spinner color="primary" /></div>
      }
      @if (facade.error(); as error) {
        <div class="state-error" role="alert">
          <ion-icon name="alert-circle-outline" aria-hidden="true" />
          <ion-text><p>{{ error }}</p></ion-text>
        </div>
      }

      @if (facade.result(); as result) {
        @if (result.available) {
          <h2 class="section-title">Turnos libres · {{ day(result.requestedDate) }}</h2>
          <ion-list class="cards slots" lines="none">
            @for (slot of result.slots; track slot.start) {
              <ion-item button detail class="tap-card slot" data-testid="slot" (click)="book(result.requestedDate, slot)">
                <ion-icon slot="start" name="time-outline" class="slot-icon" aria-hidden="true" />
                <ion-label>
                  <h2>{{ slot.start }} – {{ slot.end }}</h2>
                  <p>{{ courtsLabel(slot) }}</p>
                </ion-label>
                <ion-note slot="end" class="price">{{ price(slot.price) }}</ion-note>
              </ion-item>
            }
          </ion-list>
        } @else {
          <ion-text class="state-info">
            <p>
              @if (result.courtsRequested > 1) {
                No hay {{ result.courtsRequested }} pistas libres a la vez ese día.
              } @else {
                No quedan turnos libres ese día.
              }
            </p>
          </ion-text>
          @if (upcomingDays().length) {
            <h2 class="section-title">Días cercanos con hueco</h2>
            <div class="chips">
              @for (alt of upcomingDays(); track alt.date) {
                <ion-chip data-testid="alternative-day" (click)="searchDay(alt.date)">
                  <ion-icon name="calendar-outline" color="primary" aria-hidden="true" />
                  <ion-label>{{ day(alt.date) }} · {{ alt.freeSlotCount }} {{ alt.freeSlotCount === 1 ? 'turno' : 'turnos' }}</ion-label>
                </ion-chip>
              }
            </div>
          } @else {
            <app-empty-state icon="calendar-clear-outline" message="Tampoco hay hueco en los días cercanos." />
          }
        }
      }
      </div>
    </ion-content>
  `,
  styles: `
    .search-card {
      margin-bottom: var(--app-space-2);
      padding: var(--app-space-1) var(--app-space-2) var(--app-space-2);
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius);
      background: var(--app-surface);
      box-shadow: var(--app-shadow);
    }
    ion-datetime {
      --background: transparent;
      width: 100%;
      max-width: none;
    }
    .courts-picker {
      margin: var(--app-space-1) 0 0;
      padding: 0;
      background: transparent;
    }
    .courts-picker ion-item {
      --background: var(--app-neutral-soft);
      --border-radius: var(--app-radius-sm);
      border-radius: var(--app-radius-sm);
    }
    .slot-icon {
      margin-inline-end: var(--app-space-2);
      padding: 8px;
      border-radius: var(--app-radius-sm);
      background: var(--app-primary-soft);
      color: var(--app-on-primary-soft);
      font-size: 20px;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
    }
  `,
})
export class AvailabilitySearchPage {
  protected readonly facade = inject(AvailabilityFacade);
  private readonly bookings = inject(BookingFacade);
  private readonly modals = inject(ModalController);
  private readonly toasts = inject(ToastController);

  protected readonly today = toIsoDate(new Date());
  protected readonly courtOptions = [1, 2, 3, 4];
  protected readonly date = signal<IsoDate>(this.today);
  protected readonly courts = signal(1);

  /** The API already clamps the window to today; never offer a past day regardless. */
  protected readonly upcomingDays = computed(() =>
    (this.facade.result()?.alternativeDays ?? []).filter((alt) => alt.date >= this.today),
  );

  protected readonly day = formatDay;
  protected readonly price = formatPrice;

  protected courtsLabel(slot: SlotResponse): string {
    return `${slot.courtIds.length === 1 ? 'Pista' : 'Pistas'} ${slot.courtIds.join(', ')}`;
  }

  protected onDateChange(value: string | string[] | null | undefined): void {
    if (typeof value === 'string') {
      this.date.set(toIsoDate(value));
    }
  }

  protected search(): void {
    void this.facade.getAvailability({ date: this.date(), courts: this.courts() });
  }

  protected searchDay(date: IsoDate): void {
    this.date.set(date);
    this.search();
  }

  /** Opens the confirm-and-book modal; afterwards the free slots are refreshed, since they have changed. */
  protected async book(date: IsoDate, slot: SlotResponse): Promise<void> {
    const modal = await this.modals.create({ component: BookingConfirmModalComponent, componentProps: { date, slot } });
    await modal.present();
    const { data, role } = await modal.onDidDismiss<Booking>();
    if (role === 'booked' && data) {
      await this.toast(`Reserva confirmada: ${data.courtName}, ${formatDay(date)} a las ${slot.start}`, 'success');
    } else if (role === 'taken') {
      await this.toast(this.bookings.error() ?? 'Ese turno ya no está libre. Vuelve a buscar.', 'danger');
    } else {
      return;
    }
    await this.facade.refresh();
  }

  private async toast(message: string, color: 'success' | 'danger'): Promise<void> {
    await (await this.toasts.create({ message, color, duration: 3000 })).present();
  }
}

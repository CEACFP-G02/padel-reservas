import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonDatetime,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
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

import { Booking, IsoDate, SlotResponse } from '../../../shared/models';
import { toIsoDate } from '../../../shared/util/date';
import { formatDay, formatPrice } from '../../../shared/util/format';
import { BookingConfirmModal } from '../../booking/components/booking-confirm.modal';
import { BookingFacade } from '../../booking/booking.facade';
import { AvailabilityFacade } from '../availability.facade';

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
    IonListHeader,
    IonItem,
    IonLabel,
    IonNote,
    IonText,
    IonChip,
    IonDatetime,
    IonSelect,
    IonSelectOption,
    IonSpinner,
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
      <ion-datetime
        presentation="date"
        locale="es-ES"
        [firstDayOfWeek]="1"
        [min]="today"
        [value]="date()"
        (ionChange)="onDateChange($event.detail.value)"
      />

      <ion-list>
        <ion-item>
          <ion-select label="Pistas a la vez" [value]="courts()" (ionChange)="courts.set($event.detail.value)">
            @for (n of courtOptions; track n) {
              <ion-select-option [value]="n">{{ n }}</ion-select-option>
            }
          </ion-select>
        </ion-item>
      </ion-list>

      <ion-button expand="block" data-testid="search" (click)="search()" [disabled]="facade.loading()">Buscar</ion-button>

      @if (facade.loading()) {
        <div class="ion-text-center ion-padding"><ion-spinner /></div>
      }
      @if (facade.error(); as error) {
        <ion-text color="danger"><p>{{ error }}</p></ion-text>
      }

      @if (facade.result(); as result) {
        @if (result.available) {
          <ion-list>
            <ion-list-header>Turnos libres · {{ day(result.requestedDate) }}</ion-list-header>
            @for (slot of result.slots; track slot.start) {
              <ion-item button detail data-testid="slot" (click)="book(result.requestedDate, slot)">
                <ion-label>
                  {{ slot.start }} – {{ slot.end }}
                  <p>{{ courtsLabel(slot) }}</p>
                </ion-label>
                <ion-note slot="end">{{ price(slot.price) }}</ion-note>
              </ion-item>
            }
          </ion-list>
        } @else {
          <ion-text>
            <p>
              @if (result.courtsRequested > 1) {
                No hay {{ result.courtsRequested }} pistas libres a la vez ese día.
              } @else {
                No quedan turnos libres ese día.
              }
            </p>
          </ion-text>
          @if (upcomingDays().length) {
            <ion-list-header>Días cercanos con hueco</ion-list-header>
            @for (alt of upcomingDays(); track alt.date) {
              <ion-chip data-testid="alternative-day" (click)="searchDay(alt.date)">
                {{ day(alt.date) }} · {{ alt.freeSlotCount }} {{ alt.freeSlotCount === 1 ? 'turno' : 'turnos' }}
              </ion-chip>
            }
          } @else {
            <ion-text color="medium"><p>Tampoco hay hueco en los días cercanos.</p></ion-text>
          }
        }
      }
    </ion-content>
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
    const modal = await this.modals.create({ component: BookingConfirmModal, componentProps: { date, slot } });
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

import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonButtons,
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
  ToastController,
} from '@ionic/angular';

import { IsoDate, SlotResponse } from '../../../shared/models';
import { toIsoDate } from '../../../shared/util/date';
import { BookingFacade } from '../../booking/booking.facade';
import { AvailabilityFacade } from '../availability.facade';

/** Headline screen: date + number of courts → free slots, or nearby days when the day is full. */
@Component({
  selector: 'app-availability-search',
  imports: [
    CurrencyPipe,
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
          <ion-select label="Pistas" [value]="courts()" (ionChange)="courts.set($event.detail.value)">
            @for (n of courtOptions; track n) {
              <ion-select-option [value]="n">{{ n }}</ion-select-option>
            }
          </ion-select>
        </ion-item>
      </ion-list>

      <ion-button expand="block" (click)="search()" [disabled]="facade.loading()">Buscar</ion-button>

      @if (facade.loading()) {
        <div class="ion-text-center ion-padding"><ion-spinner /></div>
      }
      @if (facade.error(); as error) {
        <ion-text color="danger"><p>{{ error }}</p></ion-text>
      }

      @if (facade.result(); as result) {
        @if (result.available) {
          <ion-list>
            <ion-list-header>Turnos libres</ion-list-header>
            @for (slot of result.slots; track slot.start) {
              <ion-item>
                <ion-label>
                  {{ slot.start }} – {{ slot.end }}
                  <p>{{ slot.courtsFree }} pistas libres · {{ slot.price | currency: 'EUR' }}</p>
                </ion-label>
                <ion-button slot="end" data-testid="book-slot" (click)="book(result.requestedDate, slot)">
                  Reservar
                </ion-button>
              </ion-item>
            }
          </ion-list>
        } @else {
          <ion-list>
            <ion-list-header>Días cercanos con hueco</ion-list-header>
            @for (day of result.alternativeDays; track day.date) {
              <ion-item button data-testid="alternative-day" (click)="searchDay(day.date)">
                <ion-label>{{ day.date }}</ion-label>
                <ion-note slot="end">{{ day.freeSlotCount }} turnos</ion-note>
              </ion-item>
            } @empty {
              <ion-item><ion-label>No hay huecos en los días cercanos.</ion-label></ion-item>
            }
          </ion-list>
        }
      }
    </ion-content>
  `,
})
export class AvailabilitySearchPage {
  protected readonly facade = inject(AvailabilityFacade);
  private readonly bookings = inject(BookingFacade);
  private readonly alerts = inject(AlertController);
  private readonly toasts = inject(ToastController);

  protected readonly today = toIsoDate(new Date());
  protected readonly courtOptions = [1, 2, 3, 4];
  protected readonly date = signal<IsoDate>(this.today);
  protected readonly courts = signal(1);

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

  /** Books one court for the slot: the only free one, or the one the user picks. */
  protected async book(date: IsoDate, slot: SlotResponse): Promise<void> {
    const courtId = slot.courtIds.length === 1 ? slot.courtIds[0] : await this.pickCourt(slot);
    if (courtId === null) {
      return;
    }
    const booking = await this.bookings.createBooking({ courtId, date, slots: [{ start: slot.start, end: slot.end }] });
    const toast = booking
      ? { message: `Reserva confirmada: ${booking.courtName}, ${slot.start}`, color: 'success' }
      : { message: this.bookings.error() ?? 'No se pudo crear la reserva.', color: 'danger' };
    await (await this.toasts.create({ ...toast, duration: 2500 })).present();
  }

  private async pickCourt(slot: SlotResponse): Promise<number | null> {
    const alert = await this.alerts.create({
      header: 'Elige pista',
      subHeader: `${slot.start} – ${slot.end}`,
      inputs: slot.courtIds.map((id, index) => ({ type: 'radio', label: `Pista ${id}`, value: id, checked: index === 0 })),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Reservar', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role, data } = await alert.onDidDismiss<{ values: number }>();
    return role === 'confirm' && data ? data.values : null;
  }
}

import { Component, PendingTasks, computed, inject, input, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonRadio,
  IonRadioGroup,
  IonText,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';

import { IsoDate, SlotResponse } from '../../../shared/models';
import { formatDay, formatPrice } from '../../../shared/util/format';
import { BookingFacade } from '../booking.facade';

/**
 * Confirm-and-book step for one free slot. Dismisses with role `booked` (data: the booking), `taken` (409:
 * someone else got it first) or `cancel`; any other failure is shown here so the client can retry.
 */
@Component({
  selector: 'app-booking-confirm',
  imports: [
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
    IonRadioGroup,
    IonRadio,
    IonText,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Confirmar reserva</ion-title>
        <ion-buttons slot="end">
          <ion-button data-testid="cancel-booking" (click)="cancel()">Cancelar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list>
        <ion-item>
          <ion-label>Día</ion-label>
          <ion-note slot="end">{{ day() }}</ion-note>
        </ion-item>
        <ion-item>
          <ion-label>Hora</ion-label>
          <ion-note slot="end">{{ slot().start }} – {{ slot().end }}</ion-note>
        </ion-item>
        <ion-item>
          <ion-label>Precio</ion-label>
          <ion-note slot="end">{{ price() }}</ion-note>
        </ion-item>
      </ion-list>

      <ion-list>
        <ion-list-header>Pista</ion-list-header>
        <ion-radio-group [value]="selectedCourt()" (ionChange)="courtId.set($event.detail.value)">
          @for (id of slot().courtIds; track id) {
            <ion-item>
              <ion-radio data-testid="court-option" [value]="id">Pista {{ id }}</ion-radio>
            </ion-item>
          }
        </ion-radio-group>
      </ion-list>

      @if (failure(); as message) {
        <ion-text color="danger"><p>{{ message }}</p></ion-text>
      }

      <ion-button expand="block" data-testid="confirm-booking" [disabled]="bookings.loading()" (click)="confirm()">
        Reservar Pista {{ selectedCourt() }}
      </ion-button>
    </ion-content>
  `,
})
export class BookingConfirmModal {
  protected readonly bookings = inject(BookingFacade);
  private readonly modal = inject(ModalController);
  private readonly pendingTasks = inject(PendingTasks);

  readonly date = input.required<IsoDate>();
  readonly slot = input.required<SlotResponse>();

  /** The court the client picked; until then the first free one. */
  protected readonly courtId = signal<number | null>(null);
  protected readonly selectedCourt = computed(() => this.courtId() ?? this.slot().courtIds[0]);
  protected readonly day = computed(() => formatDay(this.date()));
  protected readonly price = computed(() => formatPrice(this.slot().price));
  protected readonly failure = signal<string | null>(null);

  protected async confirm(): Promise<void> {
    const done = this.pendingTasks.add();
    try {
      this.failure.set(null);
      const { start, end } = this.slot();
      const booking = await this.bookings.createBooking({
        courtId: this.selectedCourt(),
        date: this.date(),
        slots: [{ start, end }],
      });
      if (booking) {
        await this.modal.dismiss(booking, 'booked');
      } else if (this.bookings.slotTaken()) {
        await this.modal.dismiss(null, 'taken');
      } else {
        this.failure.set(this.bookings.error() ?? 'No se pudo crear la reserva.');
      }
    } finally {
      done();
    }
  }

  protected cancel(): void {
    void this.modal.dismiss(null, 'cancel');
  }
}

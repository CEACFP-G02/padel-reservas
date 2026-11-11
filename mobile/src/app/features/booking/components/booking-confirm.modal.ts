import { Component, PendingTasks, computed, inject, input, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
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
import { addIcons } from 'ionicons';
import { alertCircleOutline, calendarOutline, pricetagOutline, tennisballOutline, timeOutline } from 'ionicons/icons';

import { IsoDate, SlotResponse } from '../../../shared/models';
import { formatDay, formatPrice } from '../../../shared/util/format';
import { BookingFacade } from '../booking.facade';

addIcons({ alertCircleOutline, calendarOutline, pricetagOutline, tennisballOutline, timeOutline });

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
    IonIcon,
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
      <section class="summary" aria-label="Resumen">
        <div class="summary-court">
          <span class="summary-icon"><ion-icon name="tennisball-outline" aria-hidden="true" /></span>
          <span class="summary-court-name">Pista {{ selectedCourt() }}</span>
        </div>
        <ion-list lines="none" class="summary-rows">
          <ion-item>
            <ion-icon slot="start" name="calendar-outline" aria-hidden="true" />
            <ion-label>Día</ion-label>
            <ion-note slot="end">{{ day() }}</ion-note>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="time-outline" aria-hidden="true" />
            <ion-label>Hora</ion-label>
            <ion-note slot="end">{{ slot().start }} – {{ slot().end }}</ion-note>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="pricetag-outline" aria-hidden="true" />
            <ion-label>Precio</ion-label>
            <ion-note slot="end" class="price">{{ price() }}</ion-note>
          </ion-item>
        </ion-list>
      </section>

      <ion-list inset="true" class="court-options">
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
        <div class="state-error" role="alert">
          <ion-icon name="alert-circle-outline" aria-hidden="true" />
          <ion-text><p>{{ message }}</p></ion-text>
        </div>
      }

      <ion-button expand="block" data-testid="confirm-booking" [disabled]="bookings.loading()" (click)="confirm()">
        Reservar Pista {{ selectedCourt() }}
      </ion-button>
    </ion-content>
  `,
  styles: `
    .summary {
      margin-bottom: var(--app-space-2);
      padding: var(--app-space-2);
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius);
      background: var(--app-surface);
      box-shadow: var(--app-shadow);
    }
    .summary-court {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--app-border);
    }
    .summary-icon {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border-radius: var(--app-radius-sm);
      background: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
      box-shadow: inset 0 -3px 0 var(--ion-color-secondary);
      font-size: 22px;
    }
    .summary-court-name {
      font-size: 20px;
      font-weight: 700;
    }
    .summary-rows {
      padding: 0;
      background: transparent;
    }
    .summary-rows ion-item {
      --background: transparent;
      --padding-start: 0;
      --inner-padding-end: 0;
      --min-height: 44px;
    }
    .summary-rows ion-icon {
      margin-inline-end: 12px;
      color: var(--app-muted);
      font-size: 20px;
    }
    .summary-rows ion-note {
      color: var(--ion-text-color);
      font-size: 15px;
      font-weight: 600;
    }
    .summary-rows ion-note.price {
      color: var(--ion-color-primary);
    }
    .court-options ion-list-header {
      padding-inline-start: var(--app-space-2);
    }
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

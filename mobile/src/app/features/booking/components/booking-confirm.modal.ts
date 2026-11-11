import { Component, OnInit, PendingTasks, computed, inject, input, signal } from '@angular/core';
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
import {
  alertCircleOutline,
  calendarOutline,
  cardOutline,
  pricetagOutline,
  tennisballOutline,
  ticketOutline,
  timeOutline,
} from 'ionicons/icons';

import { IsoDate, SlotResponse } from '../../../shared/models';
import { formatDay, formatPrice } from '../../../shared/util/format';
import { PaymentMethodFacade } from '../../payment-method/payment-method.facade';
import { WalletFacade } from '../../wallet/wallet.facade';
import { BookingFacade } from '../booking.facade';

addIcons({ alertCircleOutline, calendarOutline, cardOutline, pricetagOutline, tennisballOutline, ticketOutline, timeOutline });

/**
 * Confirm-and-book step for one free slot, paid credit first (docs/api.md, "Paying a client booking"): with a
 * credit the slot costs nothing; otherwise its price is charged to the card the client picks (the default one
 * preselected). The server makes the final split; this shows it with the last known balance. Dismisses with role `booked` (data: the booking), `taken` (409:
 * someone else got it first) or `cancel`; any other failure is shown here so the client can retry.
 */
@Component({
  selector: 'app-booking-confirm-modal',
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

      <section class="split" data-testid="payment-split" aria-label="Pago">
        <div class="split-row">
          <span><ion-icon name="ticket-outline" aria-hidden="true" /> Créditos usados</span>
          <strong>{{ creditsUsed() ?? '—' }}</strong>
        </div>
        <div class="split-row">
          <span><ion-icon name="card-outline" aria-hidden="true" /> Importe a cobrar</span>
          <strong class="amount">{{ amountLabel() }}</strong>
        </div>
      </section>

      @if (needsCard()) {
        @if (payments.methods().length) {
          <ion-list inset="true" class="card-options">
            <ion-list-header>Tarjeta</ion-list-header>
            <ion-radio-group [value]="selectedCard()" (ionChange)="cardId.set($event.detail.value)">
              @for (method of payments.methods(); track method.id) {
                <ion-item>
                  <ion-radio data-testid="card-option" [value]="method.id">
                    {{ method.brand }} •••• {{ method.last4 }}
                    @if (method.default) {
                      <span class="default">Predeterminada</span>
                    }
                  </ion-radio>
                </ion-item>
              }
            </ion-radio-group>
          </ion-list>
        } @else {
          <div class="state-info"><p>Añade una tarjeta en Monedero para pagar el importe.</p></div>
        }
      }

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

      <ion-button expand="block" data-testid="confirm-booking" [disabled]="!canBook()" (click)="confirm()">
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
    .court-options ion-list-header,
    .card-options ion-list-header {
      padding-inline-start: var(--app-space-2);
    }
    .split {
      margin-bottom: var(--app-space-2);
      padding: 12px var(--app-space-2);
      border-radius: var(--app-radius-sm);
      background: var(--app-accent-soft);
      color: var(--app-on-accent-soft);
    }
    .split-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 32px;
    }
    .split-row span {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .split-row strong {
      font-variant-numeric: tabular-nums;
    }
    .split-row .amount {
      color: var(--ion-color-primary);
    }
    .default {
      margin-inline-start: 8px;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--app-accent-soft);
      color: var(--app-on-accent-soft);
      font-size: 12px;
      font-weight: 600;
    }
  `,
})
export class BookingConfirmModalComponent implements OnInit {
  protected readonly bookings = inject(BookingFacade);
  private readonly wallet = inject(WalletFacade);
  protected readonly payments = inject(PaymentMethodFacade);
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

  /** One slot: a credit covers it if the client has any; `null` while the balance is unknown. */
  protected readonly creditsUsed = computed(() => {
    const balance = this.wallet.balance();
    return balance === null ? null : Math.min(Math.max(balance, 0), 1);
  });
  protected readonly amount = computed(() => (this.creditsUsed() === 0 ? this.slot().price : 0));
  protected readonly amountLabel = computed(() => (this.creditsUsed() === null ? '—' : formatPrice(this.amount())));
  protected readonly needsCard = computed(() => this.amount() > 0);
  /** The card the client picked; until then the default one, or the first. */
  protected readonly cardId = signal<number | null>(null);
  protected readonly selectedCard = computed(() => {
    const methods = this.payments.methods();
    const picked = methods.find((method) => method.id === this.cardId());
    return (picked ?? methods.find((method) => method.default) ?? methods[0])?.id ?? null;
  });
  protected readonly canBook = computed(
    () =>
      !this.bookings.loading() && this.creditsUsed() !== null && (!this.needsCard() || this.selectedCard() !== null),
  );

  ngOnInit(): void {
    void this.wallet.refreshBalance();
    void this.payments.listMethods();
  }

  protected async confirm(): Promise<void> {
    const done = this.pendingTasks.add();
    try {
      this.failure.set(null);
      const { start, end } = this.slot();
      const paymentMethodId = this.needsCard() ? this.selectedCard() : null;
      const booking = await this.bookings.createBooking({
        courtId: this.selectedCourt(),
        date: this.date(),
        slots: [{ start, end }],
        ...(paymentMethodId !== null && { paymentMethodId }),
      });
      if (booking) {
        void this.wallet.refreshBalance();
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

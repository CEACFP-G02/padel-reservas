import { Component, PendingTasks, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
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
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircleOutline, cardOutline, ticketOutline, walletOutline } from 'ionicons/icons';

import { CreditTransaction } from '../../../shared/models';
import { formatPrice, formatTimestamp } from '../../../shared/util/format';
import { PaymentMethodFacade } from '../../payment-method/payment-method.facade';
import { WalletFacade } from '../wallet.facade';

addIcons({ alertCircleOutline, cardOutline, ticketOutline, walletOutline });

/** Wallet: credit balance, buying a pack with a saved card, and the recent movements. */
@Component({
  selector: 'app-wallet',
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonNote,
    IonRadioGroup,
    IonRadio,
    IonButton,
    IonIcon,
    IonText,
    IonSpinner,
  ],
  template: `
    <ion-header>
      <ion-toolbar><ion-title>Monedero</ion-title></ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="page">
        <section class="balance-card" aria-label="Saldo">
          <span class="balance-icon"><ion-icon name="wallet-outline" aria-hidden="true" /></span>
          <div>
            <p class="balance-label">Tu saldo</p>
            <p class="balance" data-testid="balance">{{ balanceLabel() }}</p>
            <p class="balance-hint">1 crédito = 1 reserva prepagada</p>
          </div>
        </section>

        @if (wallet.error(); as error) {
          <div class="state-error" role="alert">
            <ion-icon name="alert-circle-outline" aria-hidden="true" />
            <ion-text><p>{{ error }}</p></ion-text>
          </div>
        }

        <h2 class="section-title">Comprar créditos</h2>
        <div class="packs" role="radiogroup" aria-label="Packs de crédito">
          @for (pack of wallet.packs(); track pack.id) {
            <button
              type="button"
              class="pack"
              data-testid="pack"
              role="radio"
              [attr.aria-checked]="packId() === pack.id"
              [class.selected]="packId() === pack.id"
              (click)="packId.set(pack.id)"
            >
              <span class="pack-size">{{ pack.size }} reservas</span>
              <span class="pack-per">{{ price(pack.pricePerReservation) }} / reserva</span>
              <span class="price">{{ price(pack.price) }}</span>
            </button>
          }
        </div>

        @if (payments.methods().length) {
          <ion-list inset="true" class="card-options">
            <ion-list-header>Pagar con</ion-list-header>
            <ion-radio-group [value]="selectedCard()" (ionChange)="cardId.set($event.detail.value)">
              @for (method of payments.methods(); track method.id) {
                <ion-item>
                  <ion-radio data-testid="card-option" [value]="method.id">
                    {{ method.brand }} •••• {{ method.last4 }}
                  </ion-radio>
                </ion-item>
              }
            </ion-radio-group>
          </ion-list>
        } @else {
          <div class="state-info"><p>Añade una tarjeta para comprar créditos.</p></div>
        }

        @if (wallet.purchaseError(); as error) {
          <div class="state-error" role="alert" data-testid="purchase-error">
            <ion-icon name="alert-circle-outline" aria-hidden="true" />
            <ion-text><p>{{ error }}</p></ion-text>
          </div>
        }

        <ion-button expand="block" data-testid="buy" [disabled]="!canBuy()" (click)="buy()">Comprar</ion-button>
        <ion-button expand="block" fill="outline" data-testid="cards-link" routerLink="cards">
          <ion-icon slot="start" name="card-outline" aria-hidden="true" /> Mis tarjetas
        </ion-button>

        <h2 class="section-title">Movimientos recientes</h2>
        @if (wallet.loading() && !wallet.transactions().length) {
          <div class="state-loading"><ion-spinner /></div>
        } @else if (!wallet.transactions().length) {
          <p class="empty">Todavía no tienes movimientos.</p>
        }
        <ion-list class="cards" lines="none">
          @for (transaction of wallet.transactions(); track transaction.id) {
            <ion-item class="tap-card" data-testid="transaction">
              <ion-icon slot="start" name="ticket-outline" aria-hidden="true" />
              <ion-label>
                <h2>{{ title(transaction) }}</h2>
                <p>{{ detail(transaction) }}</p>
              </ion-label>
              <ion-note slot="end" class="credits" [class.negative]="transaction.credits < 0">
                {{ credits(transaction.credits) }}
              </ion-note>
            </ion-item>
          }
        </ion-list>
      </div>
    </ion-content>
  `,
  styles: `
    .balance-card {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
      padding: var(--app-space-2);
      border-radius: var(--app-radius);
      background: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
      box-shadow: var(--app-shadow);
    }
    .balance-card p {
      margin: 0;
    }
    .balance-icon {
      display: grid;
      place-items: center;
      width: 52px;
      height: 52px;
      border-radius: var(--app-radius-sm);
      background: rgb(255 255 255 / 0.15);
      box-shadow: inset 0 -3px 0 var(--ion-color-secondary);
      font-size: 26px;
    }
    .balance-label,
    .balance-hint {
      font-size: 13px;
      opacity: 0.85;
    }
    .balance {
      font-size: 28px;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
    }
    .packs {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--app-space-1);
    }
    .pack {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px;
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius);
      background: var(--app-surface);
      box-shadow: var(--app-shadow);
      color: var(--ion-text-color);
      font: inherit;
      text-align: start;
    }
    .pack.selected {
      border-color: var(--ion-color-primary);
      box-shadow: 0 0 0 2px var(--ion-color-primary);
    }
    .pack-size {
      font-size: 17px;
      font-weight: 700;
    }
    .pack-per {
      color: var(--app-muted);
      font-size: 13px;
    }
    .card-options ion-list-header {
      padding-inline-start: var(--app-space-2);
    }
    .credits {
      color: var(--ion-color-primary);
      font-size: 16px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .credits.negative {
      color: var(--ion-color-secondary-shade);
    }
    .empty {
      color: var(--app-muted);
      text-align: center;
    }
  `,
})
export class WalletPage {
  protected readonly wallet = inject(WalletFacade);
  protected readonly payments = inject(PaymentMethodFacade);
  private readonly toasts = inject(ToastController);
  private readonly pendingTasks = inject(PendingTasks);

  protected readonly packId = signal<number | null>(null);
  /** The card the client picked; until then the default one (listed first). */
  protected readonly cardId = signal<number | null>(null);
  protected readonly selectedCard = computed(() => {
    const methods = this.payments.methods();
    return (methods.find((method) => method.id === this.cardId()) ?? methods[0])?.id ?? null;
  });
  protected readonly canBuy = computed(
    () => this.packId() !== null && this.selectedCard() !== null && !this.wallet.loading(),
  );
  protected readonly balanceLabel = computed(() => {
    const balance = this.wallet.balance();
    return balance === null ? '—' : `${balance} ${balance === 1 ? 'crédito' : 'créditos'}`;
  });

  constructor() {
    void this.wallet.loadWallet();
    void this.payments.listMethods();
  }

  protected price(amount: number): string {
    return formatPrice(amount);
  }

  protected title(transaction: CreditTransaction): string {
    return transaction.type === 'PURCHASE' ? `Compra de pack de ${transaction.packSize}` : 'Reserva';
  }

  protected detail(transaction: CreditTransaction): string {
    const day = formatTimestamp(transaction.createdAt);
    return transaction.amount === null ? day : `${day} · ${formatPrice(transaction.amount)}`;
  }

  protected credits(credits: number): string {
    return credits > 0 ? `+${credits}` : `−${Math.abs(credits)}`;
  }

  protected async buy(): Promise<void> {
    const packId = this.packId();
    const cardId = this.selectedCard();
    if (packId === null || cardId === null) {
      return;
    }
    const done = this.pendingTasks.add();
    try {
      if (await this.wallet.buyPack(packId, cardId)) {
        const size = this.wallet.packs().find((pack) => pack.id === packId)?.size;
        await (
          await this.toasts.create({ message: `¡Listo! Has añadido ${size} créditos.`, color: 'success', duration: 3000 })
        ).present();
        this.packId.set(null);
      }
    } finally {
      done();
    }
  }
}

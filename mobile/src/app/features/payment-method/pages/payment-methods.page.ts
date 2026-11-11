import { Component, PendingTasks, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircleOutline, cardOutline } from 'ionicons/icons';

import { PaymentMethod } from '../../../shared/models';
import { PaymentMethodFacade } from '../payment-method.facade';

addIcons({ alertCircleOutline, cardOutline });

const notBlank = (control: AbstractControl<string>): ValidationErrors | null =>
  control.value.trim() ? null : { required: true };

/**
 * The client's saved cards: list (default first), make default, remove, and add one. The card number lives
 * only in this form until it is sent; the form is cleared right after a successful add.
 */
@Component({
  selector: 'app-payment-methods',
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonText,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/tabs/wallet" text="Monedero" /></ion-buttons>
        <ion-title>Mis tarjetas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="page">
        @if (facade.error(); as error) {
          <div class="state-error" role="alert">
            <ion-icon name="alert-circle-outline" aria-hidden="true" />
            <ion-text><p>{{ error }}</p></ion-text>
          </div>
        }

        <ion-list class="cards" lines="none">
          @for (method of facade.methods(); track method.id) {
            <ion-item class="tap-card" data-testid="method">
              <ion-icon slot="start" name="card-outline" aria-hidden="true" />
              <ion-label>
                <h2>{{ method.brand }} •••• {{ method.last4 }}</h2>
                <p>Caduca {{ expiry(method) }}</p>
              </ion-label>
              <div slot="end" class="actions">
                @if (method.default) {
                  <span class="default">Predeterminada</span>
                } @else {
                  <ion-button size="small" fill="clear" data-testid="make-default" (click)="makeDefault(method)">
                    Predeterminar
                  </ion-button>
                }
                <ion-button size="small" fill="clear" color="danger" data-testid="remove" (click)="remove(method)">
                  Eliminar
                </ion-button>
              </div>
            </ion-item>
          } @empty {
            <p class="empty">Todavía no tienes tarjetas guardadas.</p>
          }
        </ion-list>

        <h2 class="section-title">Añadir tarjeta</h2>
        <form [formGroup]="form" (ngSubmit)="add()">
          <ion-list inset="true">
            <ion-item>
              <ion-input
                label="Número de tarjeta"
                labelPlacement="stacked"
                inputmode="numeric"
                autocomplete="cc-number"
                formControlName="cardNumber"
                errorText="Introduce entre 13 y 19 dígitos."
              />
            </ion-item>
            <ion-item>
              <ion-input
                label="Caducidad (AAAA-MM)"
                labelPlacement="stacked"
                placeholder="2028-12"
                autocomplete="cc-exp"
                formControlName="expiry"
                errorText="Usa el formato AAAA-MM."
              />
            </ion-item>
            <ion-item>
              <ion-input
                label="Titular"
                labelPlacement="stacked"
                autocomplete="cc-name"
                formControlName="holder"
                errorText="Indica el titular (máximo 100 caracteres)."
              />
            </ion-item>
          </ion-list>
          <ion-button expand="block" type="submit" [disabled]="facade.loading()">Añadir tarjeta</ion-button>
        </form>
      </div>
    </ion-content>
  `,
  styles: `
    .actions {
      display: flex;
      align-items: center;
    }
    .default {
      padding: 2px 10px;
      border-radius: 999px;
      background: var(--app-accent-soft);
      color: var(--app-on-accent-soft);
      font-size: 12px;
      font-weight: 600;
    }
    .empty {
      color: var(--app-muted);
      text-align: center;
    }
  `,
})
export class PaymentMethodsPage {
  protected readonly facade = inject(PaymentMethodFacade);
  private readonly alerts = inject(AlertController);
  private readonly toasts = inject(ToastController);
  private readonly pendingTasks = inject(PendingTasks);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    cardNumber: ['', [Validators.required, Validators.pattern(/^\d(?:[ -]?\d){12,18}$/)]],
    expiry: ['', [Validators.required, Validators.pattern(/^\d{4}-(0[1-9]|1[0-2])$/)]],
    holder: ['', [notBlank, Validators.maxLength(100)]],
  });

  constructor() {
    void this.facade.listMethods();
  }

  protected expiry(method: PaymentMethod): string {
    const [year, month] = method.expiry.split('-');
    return `${month}/${year}`;
  }

  protected async add(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const { cardNumber, expiry, holder } = this.form.getRawValue();
    const done = this.pendingTasks.add();
    try {
      if (await this.facade.addMethod({ cardNumber: cardNumber.trim(), expiry, holder: holder.trim() })) {
        this.form.reset();
        await this.toast('Tarjeta añadida.');
      }
    } finally {
      done();
    }
  }

  protected async makeDefault(method: PaymentMethod): Promise<void> {
    if (await this.facade.makeDefault(method.id)) {
      await this.toast(`${method.brand} •••• ${method.last4} es ahora tu tarjeta predeterminada.`);
    }
  }

  protected async remove(method: PaymentMethod): Promise<void> {
    const alert = await this.alerts.create({
      header: 'Eliminar tarjeta',
      message: `¿Eliminar la tarjeta ${method.brand} •••• ${method.last4}?`,
      buttons: [
        { text: 'No', role: 'cancel' },
        { text: 'Sí, eliminar', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role === 'confirm' && (await this.facade.removeMethod(method.id))) {
      await this.toast('Tarjeta eliminada.');
    }
  }

  private async toast(message: string): Promise<void> {
    await (await this.toasts.create({ message, color: 'success', duration: 3000 })).present();
  }
}

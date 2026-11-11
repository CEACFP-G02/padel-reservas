import { Component, computed, effect, inject, input, numberAttribute } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonText,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';

import { BookingStatusBadgeComponent } from '../../../shared/ui/booking-status-badge.component';
import { formatDay, formatPrice } from '../../../shared/util/format';
import { BookingFacade } from '../booking.facade';
import { isUpcoming, timeRange } from '../booking-time';

@Component({
  selector: 'app-booking-detail',
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonText,
    IonButton,
    BookingStatusBadgeComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/tabs/bookings" /></ion-buttons>
        <ion-title>Reserva</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      @if (facade.selected(); as booking) {
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ booking.courtName }}</ion-card-title>
            <ion-card-subtitle>{{ day(booking.date) }} · {{ range(booking) }}</ion-card-subtitle>
            <app-booking-status-badge [status]="booking.status" />
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              @for (slot of booking.slots; track slot.start) {
                <ion-item>
                  <ion-label>{{ slot.start }} – {{ slot.end }}</ion-label>
                  <ion-note slot="end">{{ price(slot.price) }}</ion-note>
                </ion-item>
              }
              <ion-item>
                <ion-label><strong>Total</strong></ion-label>
                <ion-note slot="end"><strong>{{ price(booking.totalPrice) }}</strong></ion-note>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
        @if (cancellable()) {
          <ion-button
            expand="block"
            color="danger"
            data-testid="cancel"
            [disabled]="facade.loading()"
            (click)="confirmCancel(booking.id)"
            >Cancelar reserva</ion-button
          >
        }
      } @else if (facade.error(); as error) {
        <ion-text color="danger"><p>{{ error }}</p></ion-text>
      }
    </ion-content>
  `,
})
export class BookingDetailPage {
  protected readonly facade = inject(BookingFacade);
  private readonly alerts = inject(AlertController);
  private readonly toasts = inject(ToastController);
  private readonly router = inject(Router);
  readonly id = input.required({ transform: numberAttribute });

  protected readonly day = formatDay;
  protected readonly price = formatPrice;
  protected readonly range = timeRange;
  protected readonly cancellable = computed(() => {
    const booking = this.facade.selected();
    return booking != null && isUpcoming(booking, new Date());
  });

  constructor() {
    effect(() => void this.facade.getBooking(this.id()));
  }

  /** Asks first; the server enforces the 24-hour rule and answers 409 when it is too late. */
  protected async confirmCancel(id: number): Promise<void> {
    const alert = await this.alerts.create({
      header: '¿Cancelar la reserva?',
      message: 'Solo puedes cancelar hasta 24 horas antes de que empiece. El turno quedará libre para otros.',
      buttons: [
        { text: 'No', role: 'cancel' },
        { text: 'Sí, cancelar', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'confirm') {
      return;
    }
    if (await this.facade.cancelBooking(id)) {
      await this.toast('Reserva cancelada.', 'success');
      void this.facade.getMyBookings({ size: 100 });
      await this.router.navigateByUrl('/tabs/bookings');
    } else {
      await this.toast(this.facade.error() ?? 'No se pudo cancelar la reserva.', 'danger');
    }
  }

  private async toast(message: string, color: 'success' | 'danger'): Promise<void> {
    await (await this.toasts.create({ message, color, duration: 3000 })).present();
  }
}

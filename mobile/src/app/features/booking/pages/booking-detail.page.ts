import { Component, effect, inject, input, numberAttribute } from '@angular/core';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { BookingStatus } from '../../../shared/models';
import { BookingStatusBadgeComponent } from '../../../shared/ui/booking-status-badge.component';
import { BookingFacade } from '../booking.facade';

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
    IonCardContent,
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
            <ion-card-title>{{ booking.date }}</ion-card-title>
            <app-booking-status-badge [status]="booking.status" />
          </ion-card-header>
          <ion-card-content>
            @for (slot of booking.slots; track slot.start) {
              <p>{{ slot.start }} – {{ slot.end }}</p>
            }
          </ion-card-content>
        </ion-card>
        @if (booking.status === confirmed) {
          <ion-button expand="block" color="danger" (click)="confirmCancel(booking.id)">Cancelar reserva</ion-button>
        }
      }
    </ion-content>
  `,
})
export class BookingDetailPage {
  protected readonly facade = inject(BookingFacade);
  private readonly alerts = inject(AlertController);
  readonly id = input.required({ transform: numberAttribute });
  protected readonly confirmed = BookingStatus.CONFIRMED;

  constructor() {
    effect(() => void this.facade.getBooking(this.id()));
  }

  protected async confirmCancel(id: number): Promise<void> {
    const alert = await this.alerts.create({
      header: '¿Cancelar la reserva?',
      message: 'Solo se puede cancelar con la antelación mínima indicada por el club.',
      buttons: [
        { text: 'No', role: 'cancel' },
        { text: 'Sí, cancelar', role: 'destructive', handler: () => void this.facade.cancelBooking(id) },
      ],
    });
    await alert.present();
  }
}

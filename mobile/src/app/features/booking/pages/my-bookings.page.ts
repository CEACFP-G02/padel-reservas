import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonProgressBar,
  IonText,
  IonTitle,
  IonToolbar,
  ViewWillEnter,
} from '@ionic/angular';

import { BookingStatusBadgeComponent } from '../../../shared/ui/booking-status-badge.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { formatDay, formatPrice } from '../../../shared/util/format';
import { BookingFacade } from '../booking.facade';
import { splitBookings, timeRange } from '../booking-time';

@Component({
  selector: 'app-my-bookings',
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
    IonProgressBar,
    IonText,
    BookingStatusBadgeComponent,
    EmptyStateComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Mis reservas</ion-title>
        @if (facade.loading()) {
          <ion-progress-bar type="indeterminate" />
        }
      </ion-toolbar>
    </ion-header>
    <ion-content>
      @if (facade.error(); as error) {
        <ion-text color="danger" class="ion-padding"><p>{{ error }}</p></ion-text>
      }

      <ion-list data-testid="upcoming">
        <ion-list-header>Próximas</ion-list-header>
        @for (booking of split().upcoming; track booking.id) {
          <ion-item data-testid="booking" [routerLink]="[booking.id]" detail>
            <ion-label>
              <h2>{{ booking.courtName }}</h2>
              <p>{{ day(booking.date) }} · {{ range(booking) }}</p>
            </ion-label>
            <ion-note slot="end">{{ price(booking.totalPrice) }}</ion-note>
            <app-booking-status-badge slot="end" [status]="booking.status" />
          </ion-item>
        } @empty {
          <app-empty-state icon="calendar-outline" message="No tienes reservas próximas." />
        }
      </ion-list>

      @if (split().past.length) {
        <ion-list data-testid="past">
          <ion-list-header>Historial</ion-list-header>
          @for (booking of split().past; track booking.id) {
            <ion-item data-testid="booking" [routerLink]="[booking.id]" detail>
              <ion-label>
                <h2>{{ booking.courtName }}</h2>
                <p>{{ day(booking.date) }} · {{ range(booking) }}</p>
              </ion-label>
              <ion-note slot="end">{{ price(booking.totalPrice) }}</ion-note>
              <app-booking-status-badge slot="end" [status]="booking.status" />
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
})
export class MyBookingsPage implements ViewWillEnter {
  protected readonly facade = inject(BookingFacade);
  /** "Now" for the upcoming/past split, taken each time the tab is shown. */
  private readonly now = signal(new Date());
  protected readonly split = computed(() => splitBookings(this.facade.myBookings(), this.now()));

  protected readonly day = formatDay;
  protected readonly price = formatPrice;
  protected readonly range = timeRange;

  /** Tabs keep pages alive, so refresh every time the tab is shown. */
  ionViewWillEnter(): void {
    this.now.set(new Date());
    void this.facade.getMyBookings({ size: 100 });
  }
}

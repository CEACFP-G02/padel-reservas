import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonIcon,
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
import { addIcons } from 'ionicons';
import { alertCircleOutline } from 'ionicons/icons';

import { BookingStatusBadgeComponent } from '../../../shared/ui/booking-status-badge.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { formatDay, formatPrice } from '../../../shared/util/format';
import { BookingFacade } from '../booking.facade';
import { splitBookings, timeRange } from '../booking-time';

addIcons({ alertCircleOutline });

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
    IonIcon,
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
    <ion-content class="ion-padding">
      <div class="page">
      @if (facade.error(); as error) {
        <div class="state-error" role="alert">
          <ion-icon name="alert-circle-outline" aria-hidden="true" />
          <ion-text><p>{{ error }}</p></ion-text>
        </div>
      }

      <ion-list class="cards" lines="none" data-testid="upcoming">
        <ion-list-header>Próximas</ion-list-header>
        @for (booking of split().upcoming; track booking.id) {
          <ion-item class="tap-card" data-testid="booking" [routerLink]="[booking.id]" detail>
            <ion-label>
              <h2>{{ booking.courtName }}</h2>
              <p>{{ day(booking.date) }} · {{ range(booking) }}</p>
            </ion-label>
            <div slot="end" class="meta">
              <ion-note class="price">{{ price(booking.totalPrice) }}</ion-note>
              <app-booking-status-badge [status]="booking.status" />
            </div>
          </ion-item>
        } @empty {
          <app-empty-state icon="calendar-outline" message="No tienes reservas próximas." />
        }
      </ion-list>

      @if (split().past.length) {
        <ion-list class="cards past" lines="none" data-testid="past">
          <ion-list-header>Historial</ion-list-header>
          @for (booking of split().past; track booking.id) {
            <ion-item class="tap-card" data-testid="booking" [routerLink]="[booking.id]" detail>
              <ion-label>
                <h2>{{ booking.courtName }}</h2>
                <p>{{ day(booking.date) }} · {{ range(booking) }}</p>
              </ion-label>
              <div slot="end" class="meta">
                <ion-note class="price">{{ price(booking.totalPrice) }}</ion-note>
                <app-booking-status-badge [status]="booking.status" />
              </div>
            </ion-item>
          }
        </ion-list>
      }
      </div>
    </ion-content>
  `,
  styles: `
    ion-list-header {
      margin-top: var(--app-space-1);
    }
    .meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
      margin-inline-start: var(--app-space-1);
    }
    .past ion-item.tap-card {
      --background: var(--app-neutral-soft);
      box-shadow: none;
    }
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

import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToolbar, ViewWillEnter } from '@ionic/angular';

import { BookingStatusBadgeComponent } from '../../../shared/ui/booking-status-badge.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { BookingFacade } from '../booking.facade';

@Component({
  selector: 'app-my-bookings',
  imports: [RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, BookingStatusBadgeComponent, EmptyStateComponent],
  template: `
    <ion-header>
      <ion-toolbar><ion-title>Mis reservas</ion-title></ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        @for (booking of facade.myBookings(); track booking.id) {
          <ion-item [routerLink]="[booking.id]" detail>
            <ion-label>
              {{ booking.date }}
              <p>{{ booking.slots[0]?.start }} – {{ booking.slots[booking.slots.length - 1]?.end }}</p>
            </ion-label>
            <app-booking-status-badge slot="end" [status]="booking.status" />
          </ion-item>
        } @empty {
          <app-empty-state icon="calendar-outline" message="Todavía no tienes reservas." />
        }
      </ion-list>
    </ion-content>
  `,
})
export class MyBookingsPage implements ViewWillEnter {
  protected readonly facade = inject(BookingFacade);

  /** Tabs keep pages alive, so refresh every time the tab is shown. */
  ionViewWillEnter(): void {
    void this.facade.getMyBookings();
  }
}

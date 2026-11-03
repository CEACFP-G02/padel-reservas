import { Component } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { calendarOutline, personOutline, tennisballOutline } from 'ionicons/icons';

/** Authenticated layout: bottom tabs Reservar · Mis reservas · Perfil. */
@Component({
  selector: 'app-tabs',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="availability">
          <ion-icon name="tennisball-outline" />
          <ion-label>Reservar</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="bookings">
          <ion-icon name="calendar-outline" />
          <ion-label>Mis reservas</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="profile">
          <ion-icon name="person-outline" />
          <ion-label>Perfil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsPage {
  constructor() {
    addIcons({ tennisballOutline, calendarOutline, personOutline });
  }
}

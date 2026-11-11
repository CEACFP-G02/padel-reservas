import { Component, effect, inject, input, numberAttribute } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { CourtFacade } from '../court.facade';

@Component({
  selector: 'app-court-detail',
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/tabs/availability/courts" /></ion-buttons>
        <ion-title>Pista</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      @if (facade.selected(); as court) {
        <ion-card class="page">
          <ion-card-header>
            <ion-card-title>{{ court.name }}</ion-card-title>
            <ion-card-subtitle>{{ court.type }} · {{ court.indoor ? 'Cubierta' : 'Exterior' }}</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>{{ court.active ? 'Disponible para reservar' : 'Fuera de servicio' }}</ion-card-content>
        </ion-card>
      }
    </ion-content>
  `,
})
export class CourtDetailPage {
  protected readonly facade = inject(CourtFacade);
  readonly id = input.required({ transform: numberAttribute });

  constructor() {
    effect(() => void this.facade.getCourt(this.id()));
  }
}

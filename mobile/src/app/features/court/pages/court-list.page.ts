import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { CourtFacade } from '../court.facade';

@Component({
  selector: 'app-court-list',
  imports: [RouterLink, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonList, IonItem, IonLabel, IonNote, EmptyStateComponent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/tabs/availability" /></ion-buttons>
        <ion-title>Pistas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        @for (court of facade.courts(); track court.id) {
          <ion-item [routerLink]="[court.id]" detail>
            <ion-label>{{ court.name }}</ion-label>
            <ion-note slot="end">{{ court.type }} · {{ court.indoor ? 'Cubierta' : 'Exterior' }}</ion-note>
          </ion-item>
        } @empty {
          <app-empty-state message="No hay pistas disponibles." />
        }
      </ion-list>
    </ion-content>
  `,
})
export class CourtListPage {
  protected readonly facade = inject(CourtFacade);

  constructor() {
    void this.facade.listCourts();
  }
}

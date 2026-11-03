import { Component, input } from '@angular/core';
import { IonIcon, IonText } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { calendarOutline, informationCircleOutline } from 'ionicons/icons';

/** Centered icon + message for empty lists and results. */
@Component({
  selector: 'app-empty-state',
  imports: [IonIcon, IonText],
  template: `
    <div class="empty-state">
      <ion-icon [name]="icon()" size="large" color="medium" />
      <ion-text color="medium"><p>{{ message() }}</p></ion-text>
    </div>
  `,
  styles: `.empty-state { display: flex; flex-direction: column; align-items: center; padding: 32px 16px; text-align: center; }`,
})
export class EmptyStateComponent {
  constructor() {
    addIcons({ informationCircleOutline, calendarOutline });
  }

  readonly icon = input('information-circle-outline');
  readonly message = input.required<string>();
}

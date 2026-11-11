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
      <span class="empty-icon"><ion-icon [name]="icon()" aria-hidden="true" /></span>
      <ion-text><p>{{ message() }}</p></ion-text>
    </div>
  `,
  styles: `
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--app-space-1);
      margin: var(--app-space-1) 0;
      padding: var(--app-space-4) var(--app-space-2);
      border: 1px dashed var(--app-border);
      border-radius: var(--app-radius);
      background: var(--app-surface);
      color: var(--app-muted);
      text-align: center;
    }
    .empty-icon {
      display: grid;
      place-items: center;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--app-primary-soft);
      color: var(--app-on-primary-soft);
      font-size: 28px;
    }
    p {
      margin: 0;
      font-weight: 500;
    }
  `,
})
export class EmptyStateComponent {
  constructor() {
    addIcons({ informationCircleOutline, calendarOutline });
  }

  readonly icon = input('information-circle-outline');
  readonly message = input.required<string>();
}

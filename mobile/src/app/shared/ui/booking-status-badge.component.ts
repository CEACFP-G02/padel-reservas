import { Component, computed, input } from '@angular/core';
import { IonBadge } from '@ionic/angular';

import { BookingStatus } from '../models';

const APPEARANCE: Record<BookingStatus, { color: string; label: string }> = {
  [BookingStatus.CONFIRMED]: { color: 'success', label: 'Confirmada' },
  [BookingStatus.CANCELLED]: { color: 'medium', label: 'Cancelada' },
  [BookingStatus.COMPLETED]: { color: 'primary', label: 'Completada' },
};

@Component({
  selector: 'app-booking-status-badge',
  imports: [IonBadge],
  template: `<ion-badge [color]="appearance().color">{{ appearance().label }}</ion-badge>`,
})
export class BookingStatusBadgeComponent {
  readonly status = input.required<BookingStatus>();
  protected readonly appearance = computed(() => APPEARANCE[this.status()]);
}

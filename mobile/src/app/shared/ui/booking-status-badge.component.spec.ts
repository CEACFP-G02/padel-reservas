import { TestBed } from '@angular/core/testing';

import { BookingStatus } from '../models';
import { BookingStatusBadgeComponent } from './booking-status-badge.component';

describe('BookingStatusBadgeComponent', () => {
  function render(status: BookingStatus): HTMLElement {
    const fixture = TestBed.createComponent(BookingStatusBadgeComponent);
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('ion-badge');
  }

  it.each([
    [BookingStatus.CONFIRMED, 'success', 'Confirmada'],
    [BookingStatus.CANCELLED, 'medium', 'Cancelada'],
    [BookingStatus.COMPLETED, 'primary', 'Completada'],
  ])('renders %s as a %s badge labelled %s', (status, color, label) => {
    const badge = render(status);
    expect((badge as HTMLElement & { color?: string }).color).toBe(color);
    expect(badge.textContent?.trim()).toBe(label);
  });
});

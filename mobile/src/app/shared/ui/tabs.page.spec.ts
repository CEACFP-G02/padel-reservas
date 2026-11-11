import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';

import { textOf } from '../../testing/text';
import { TabsPage } from './tabs.page';

describe('TabsPage', () => {
  it('offers Reservar · Mis reservas · Monedero · Perfil', () => {
    TestBed.configureTestingModule({ imports: [TabsPage], providers: [provideRouter([]), provideIonicAngular()] });
    const fixture = TestBed.createComponent(TabsPage);
    fixture.detectChanges();

    const tabs = Array.from(fixture.nativeElement.querySelectorAll('ion-tab-button')) as HTMLElement[];
    expect(tabs.map((tab) => [tab.getAttribute('tab'), textOf(tab)])).toEqual([
      ['availability', 'Reservar'],
      ['bookings', 'Mis reservas'],
      ['wallet', 'Monedero'],
      ['profile', 'Perfil'],
    ]);
  });
});

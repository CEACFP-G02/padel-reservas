import { Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonList, IonNote, IonTitle, IonToolbar } from '@ionic/angular';

import { AuthFacade } from '../../../core/auth/auth.facade';
import { ProfileFacade } from '../profile.facade';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonInput, IonNote, IonButton],
  template: `
    <ion-header>
      <ion-toolbar><ion-title>Perfil</ion-title></ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="page">
      <form [formGroup]="form" (ngSubmit)="save()">
        <ion-list inset="true">
          <ion-item>
            <ion-input label="Nombre" labelPlacement="stacked" formControlName="name" />
          </ion-item>
          <ion-item>
            <ion-input label="Teléfono" labelPlacement="stacked" type="tel" formControlName="phone" />
          </ion-item>
          <ion-item>
            <ion-note>{{ facade.profile()?.email }}</ion-note>
          </ion-item>
        </ion-list>
        <ion-button expand="block" type="submit" [disabled]="facade.saving()">Guardar</ion-button>
      </form>
      <ion-button expand="block" fill="outline" color="medium" (click)="auth.logout()">Cerrar sesión</ion-button>
      </div>
    </ion-content>
  `,
})
export class ProfilePage {
  protected readonly facade = inject(ProfileFacade);
  protected readonly auth = inject(AuthFacade);

  protected readonly form = inject(FormBuilder).nonNullable.group({ name: [''], phone: [''] });

  constructor() {
    void this.facade.getCurrentUser();
    effect(() => {
      const profile = this.facade.profile();
      if (profile) this.form.reset({ name: profile.name, phone: profile.phone ?? '' });
    });
  }

  protected save(): void {
    // TODO: send only dirty fields -> facade.updateProfile(changes) + toast — see docs/api.md#users--clients--apiv1users
  }
}

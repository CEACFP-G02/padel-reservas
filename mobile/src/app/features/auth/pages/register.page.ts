import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonList, IonItem, IonInput, IonButton, IonText],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/login" /></ion-buttons>
        <ion-title>Crear cuenta</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form [formGroup]="form" (ngSubmit)="submit()">
        <ion-list>
          <ion-item><ion-input label="Nombre" labelPlacement="stacked" autocomplete="name" formControlName="name" /></ion-item>
          <ion-item><ion-input label="Email" labelPlacement="stacked" type="email" autocomplete="email" formControlName="email" /></ion-item>
          <ion-item><ion-input label="Contraseña" labelPlacement="stacked" type="password" autocomplete="new-password" formControlName="password" /></ion-item>
          <ion-item><ion-input label="Teléfono (opcional)" labelPlacement="stacked" type="tel" autocomplete="tel" formControlName="phone" /></ion-item>
        </ion-list>
        @if (error(); as message) {
          <ion-text color="danger"><p>{{ message }}</p></ion-text>
        }
        <ion-button expand="block" type="submit" [disabled]="form.invalid || submitting()">Registrarme</ion-button>
      </form>
    </ion-content>
  `,
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phone: [''],
  });

  protected async submit(): Promise<void> {
    // TODO: spec + implementation (auth.register -> navigate /tabs/availability; show 409 duplicate email)
    //  — see docs/api.md#auth--apiv1auth
  }
}

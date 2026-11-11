import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircleOutline, tennisballOutline } from 'ionicons/icons';

import { AuthFacade } from '../../../core/auth/auth.facade';

addIcons({ alertCircleOutline, tennisballOutline });
import { RegisterRequest } from '../../../shared/models';

/** Client self sign-up (always a CLIENT account), then logged in: page → AuthFacade (core) → AuthApi. */
@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonList, IonItem, IonInput, IonButton, IonText, IonIcon],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/login" /></ion-buttons>
        <ion-title>Crear cuenta</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding auth-content">
      <div class="auth-form">
        <div class="app-brand">
          <span class="app-brand-badge"><ion-icon name="tennisball-outline" aria-hidden="true" /></span>
          <p class="app-brand-name">Pádel <strong>Reservas</strong></p>
        </div>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <ion-list inset="true">
          <ion-item><ion-input label="Nombre" labelPlacement="stacked" autocomplete="name" formControlName="name" /></ion-item>
          <ion-item><ion-input label="Email" labelPlacement="stacked" type="email" autocomplete="email" formControlName="email" /></ion-item>
          <ion-item><ion-input label="Contraseña" labelPlacement="stacked" type="password" autocomplete="new-password" formControlName="password" /></ion-item>
          <ion-item><ion-input label="Teléfono (opcional)" labelPlacement="stacked" type="tel" autocomplete="tel" formControlName="phone" /></ion-item>
        </ion-list>
        @if (error(); as message) {
          <div class="state-error">
            <ion-icon name="alert-circle-outline" aria-hidden="true" />
            <ion-text><p role="alert" data-testid="register-error">{{ message }}</p></ion-text>
          </div>
        }
        <ion-button expand="block" type="submit" [disabled]="form.invalid || submitting()">Registrarme</ion-button>
      </form>
      </div>
    </ion-content>
  `,
})
export class RegisterPage {
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phone: [''],
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.error.set(null);
    const { name, email, password, phone } = this.form.getRawValue();
    const request: RegisterRequest = { name: name.trim(), email: email.trim(), password };
    if (phone.trim()) request.phone = phone.trim();
    try {
      await this.auth.register(request);
      await this.router.navigateByUrl('/tabs/availability');
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo crear la cuenta');
    } finally {
      this.submitting.set(false);
    }
  }
}

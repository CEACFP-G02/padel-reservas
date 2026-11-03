import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonList, IonText, IonTitle, IonToolbar } from '@ionic/angular';

import { AuthFacade } from '../../../core/auth/auth.facade';

/** Public login page for the CLIENT: page → AuthFacade (core) → AuthApi. */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonInput, IonButton, IonText],
  template: `
    <ion-header>
      <ion-toolbar><ion-title>Iniciar sesión</ion-title></ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form [formGroup]="form" (ngSubmit)="submit()">
        <ion-list>
          <ion-item>
            <ion-input label="Email" labelPlacement="stacked" type="email" autocomplete="email" formControlName="email" />
          </ion-item>
          <ion-item>
            <ion-input label="Contraseña" labelPlacement="stacked" type="password" autocomplete="current-password" formControlName="password" />
          </ion-item>
        </ion-list>
        @if (error(); as message) {
          <ion-text color="danger"><p role="alert" data-testid="login-error">{{ message }}</p></ion-text>
        }
        <ion-button expand="block" type="submit" [disabled]="form.invalid || submitting()">Entrar</ion-button>
      </form>
      <ion-button expand="block" fill="clear" routerLink="/register">Crear cuenta</ion-button>
    </ion-content>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);

  /** Bound from `?returnUrl=` set by clientGuard; the router binds `undefined` when it is absent. */
  readonly returnUrl = input<string | undefined>();
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.error.set(null);
    try {
      await this.auth.login(this.form.getRawValue());
      await this.router.navigateByUrl(this.returnUrl() || '/tabs/availability');
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo iniciar sesión');
    } finally {
      this.submitting.set(false);
    }
  }
}

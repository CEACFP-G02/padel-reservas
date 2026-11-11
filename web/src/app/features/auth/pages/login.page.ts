import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';

import { AuthFacade } from '../../../core/auth/auth.facade';

/** Public login page for the OWNER: page → AuthFacade (core) → AuthApi. */
@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <mat-card class="login" appearance="outlined">
      <div class="brand">
        <span class="badge"><mat-icon>sports_tennis</mat-icon></span>
        <span class="wordmark">Pádel <strong>Reservas</strong></span>
      </div>
      <mat-card-header><mat-card-title>Padel Admin</mat-card-title></mat-card-header>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-card-content>
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="username" />
            @if (form.controls.email.hasError('email')) {
              <mat-error>Introduce un email válido</mat-error>
            } @else if (form.controls.email.hasError('required')) {
              <mat-error>El email es obligatorio</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Contraseña</mat-label>
            <input
              matInput
              type="password"
              formControlName="password"
              autocomplete="current-password"
            />
            @if (form.controls.password.hasError('required')) {
              <mat-error>La contraseña es obligatoria</mat-error>
            }
          </mat-form-field>
          @if (error(); as message) {
            <p class="error" role="alert" data-testid="login-error">{{ message }}</p>
          }
        </mat-card-content>
        <mat-card-actions>
          <button
            matButton="filled"
            class="submit"
            type="submit"
            [disabled]="form.invalid || submitting()"
          >
            Entrar
          </button>
        </mat-card-actions>
      </form>
    </mat-card>
  `,
  styles: `
    :host {
      display: grid;
      place-items: center;
      min-height: 100%;
      padding: var(--app-space-2);
      box-sizing: border-box;
      background:
        radial-gradient(
          1200px 600px at 10% -10%,
          var(--mat-sys-primary-container),
          transparent 60%
        ),
        radial-gradient(800px 400px at 110% 110%, var(--app-accent-soft), transparent 60%),
        var(--mat-sys-surface);
    }
    .login {
      width: 100%;
      max-width: 400px;
      padding: var(--app-space-3) var(--app-space-1) var(--app-space-2);
      box-shadow: var(--app-shadow-lg);
    }
    .brand {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      margin-bottom: var(--app-space-1);
    }
    .badge {
      display: grid;
      place-items: center;
      width: 56px;
      height: 56px;
      border-radius: var(--app-radius);
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      box-shadow: inset 0 -4px 0 var(--app-accent);
    }
    .badge mat-icon {
      width: 32px;
      height: 32px;
      font-size: 32px;
    }
    .wordmark {
      font: var(--mat-sys-headline-small);
      letter-spacing: -0.02em;
    }
    .wordmark strong {
      color: var(--mat-sys-primary);
      font-weight: 700;
    }
    mat-card-header {
      justify-content: center;
      padding-top: 0;
    }
    mat-card-title {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-title-small);
      text-align: center;
    }
    mat-card-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: var(--app-space-2);
    }
    mat-card-actions {
      padding: 0 var(--app-space-2) var(--app-space-1);
    }
    .submit {
      width: 100%;
      height: 44px;
    }
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);

  /** Bound from `?returnUrl=` set by ownerGuard; the router binds `undefined` when it is absent. */
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
      await this.router.navigateByUrl(this.returnUrl() || '/dashboard');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo iniciar sesión');
    } finally {
      this.submitting.set(false);
    }
  }
}

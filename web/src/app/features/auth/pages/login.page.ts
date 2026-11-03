import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';

import { AuthFacade } from '../../../core/auth/auth.facade';

/** Public login page for the OWNER: page → AuthFacade (core) → AuthApi. */
@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <mat-card class="login">
      <mat-card-header><mat-card-title>Padel Admin</mat-card-title></mat-card-header>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-card-content>
          <mat-form-field>
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="username" />
            @if (form.controls.email.hasError('email')) {
              <mat-error>Introduce un email válido</mat-error>
            } @else if (form.controls.email.hasError('required')) {
              <mat-error>El email es obligatorio</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Contraseña</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="current-password" />
            @if (form.controls.password.hasError('required')) {
              <mat-error>La contraseña es obligatoria</mat-error>
            }
          </mat-form-field>
          @if (error(); as message) {
            <p class="error" role="alert" data-testid="login-error">{{ message }}</p>
          }
        </mat-card-content>
        <mat-card-actions align="end">
          <button matButton="filled" type="submit" [disabled]="form.invalid || submitting()">Entrar</button>
        </mat-card-actions>
      </form>
    </mat-card>
  `,
  styles: `
    :host { display: grid; place-items: center; min-height: 100%; padding: 16px; box-sizing: border-box; }
    .login { width: 100%; max-width: 380px; }
    mat-card-content { display: flex; flex-direction: column; }
    .error { color: var(--mat-sys-error); margin: 0 0 8px; }
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

import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';

/** Public login page for the OWNER. Uses core AuthService (no feature facade). */
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
          </mat-form-field>
          <mat-form-field>
            <mat-label>Contraseña</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="current-password" />
          </mat-form-field>
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
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  /** Bound from `?returnUrl=` set by ownerGuard. */
  readonly returnUrl = input<string>('/dashboard');
  protected readonly submitting = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected async submit(): Promise<void> {
    this.submitting.set(true);
    try {
      await this.auth.login(this.form.getRawValue());
      await this.router.navigateByUrl(this.returnUrl());
    } catch (error) {
      this.snackBar.open(error instanceof Error ? error.message : 'Error de inicio de sesión', 'OK', { duration: 4000 });
    } finally {
      this.submitting.set(false);
    }
  }
}

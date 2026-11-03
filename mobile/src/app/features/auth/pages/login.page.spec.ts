import { TestBed } from '@angular/core/testing';
import type { Mock } from 'vitest';
import { Router, provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';

import { AuthFacade } from '../../../core/auth/auth.facade';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  type Login = (credentials: { email: string; password: string }) => Promise<void>;
  let login: Mock<Login>;

  function render(returnUrl?: string | undefined, bind = returnUrl !== undefined) {
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([]), provideIonicAngular(), { provide: AuthFacade, useValue: { login } }],
    });
    const fixture = TestBed.createComponent(LoginPage);
    if (bind) fixture.componentRef.setInput('returnUrl', returnUrl);
    fixture.detectChanges();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const page = fixture.componentInstance;
    page['form'].setValue({ email: 'ana@example.com', password: 'secret123' });
    return { fixture, page, navigate, element: fixture.nativeElement as HTMLElement };
  }

  beforeEach(() => {
    login = vi.fn<Login>();
  });

  it('shows the Spanish login form with a link to create an account', () => {
    const { element } = render();

    expect(element.querySelector('ion-title')?.textContent).toContain('Iniciar sesión');
    expect(element.querySelector('ion-input[formControlName="email"]')?.getAttribute('label')).toBe('Email');
    expect(element.querySelector('ion-input[formControlName="password"]')?.getAttribute('label')).toBe('Contraseña');
    expect(element.querySelector('ion-button[type="submit"]')?.textContent?.trim()).toBe('Entrar');
    expect(element.querySelector('ion-button[routerLink="/register"]')?.textContent?.trim()).toBe('Crear cuenta');
  });

  it('logs in and goes to the availability search by default', async () => {
    login.mockResolvedValue();
    const { page, navigate } = render();
    await page['submit']();
    expect(login).toHaveBeenCalledWith({ email: 'ana@example.com', password: 'secret123' });
    expect(navigate).toHaveBeenCalledWith('/tabs/availability');
  });

  it('returns to the guarded URL after login', async () => {
    login.mockResolvedValue();
    const { page, navigate } = render('/tabs/bookings');
    await page['submit']();
    expect(navigate).toHaveBeenCalledWith('/tabs/bookings');
  });

  it('falls back to the availability search when the router binds no returnUrl', async () => {
    login.mockResolvedValue();
    const { page, navigate } = render(undefined, true);
    await page['submit']();
    expect(navigate).toHaveBeenCalledWith('/tabs/availability');
  });

  it('does not submit an invalid form', async () => {
    const { page, navigate } = render();
    page['form'].setValue({ email: 'not-an-email', password: '' });

    await page['submit']();

    expect(login).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows the error and stays on the page when login fails', async () => {
    login.mockImplementation(async () => {
      throw new Error('Email o contraseña incorrectos');
    });
    const { fixture, page, navigate, element } = render();
    await page['submit']();
    await fixture.whenStable();

    expect(page['error']()).toBe('Email o contraseña incorrectos');
    expect(element.querySelector('[data-testid="login-error"]')?.textContent?.trim()).toBe(
      'Email o contraseña incorrectos',
    );
    expect(navigate).not.toHaveBeenCalled();
  });
});

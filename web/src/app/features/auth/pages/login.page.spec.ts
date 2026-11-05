import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AuthFacade } from '../../../core/auth/auth.facade';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let login: ReturnType<typeof vi.fn>;
  let router: Router;

  async function render(returnUrl?: string) {
    login = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([]), { provide: AuthFacade, useValue: { login } }],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginPage);
    if (returnUrl) fixture.componentRef.setInput('returnUrl', returnUrl);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  function type(element: HTMLElement, name: string, value: string) {
    const input = element.querySelector(`input[formControlName="${name}"]`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  const submitButton = (element: HTMLElement) => element.querySelector('button[type="submit"]') as HTMLButtonElement;

  it('shows the Spanish login form', async () => {
    const { element } = await render();

    expect(element.textContent).toContain('Email');
    expect(element.textContent).toContain('Contraseña');
    expect(submitButton(element).textContent?.trim()).toBe('Entrar');
  });

  it('keeps the button disabled until the form is valid', async () => {
    const { fixture, element } = await render();
    expect(submitButton(element).disabled).toBe(true);

    type(element, 'email', 'not-an-email');
    type(element, 'password', 'secret');
    await fixture.whenStable();
    expect(submitButton(element).disabled).toBe(true);

    type(element, 'email', 'owner@padel.test');
    await fixture.whenStable();
    expect(submitButton(element).disabled).toBe(false);
  });

  it('logs in through the facade and goes to the dashboard by default', async () => {
    const { fixture, element } = await render();
    type(element, 'email', 'owner@padel.test');
    type(element, 'password', 'secret');
    await fixture.whenStable();

    submitButton(element).click();
    await fixture.whenStable();

    expect(login).toHaveBeenCalledWith({ email: 'owner@padel.test', password: 'secret' });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('returns to the page the guard sent the user from', async () => {
    const { fixture, element } = await render('/courts');
    type(element, 'email', 'owner@padel.test');
    type(element, 'password', 'secret');
    await fixture.whenStable();

    submitButton(element).click();
    await fixture.whenStable();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/courts');
  });

  it('falls back to the dashboard when the router binds no returnUrl', async () => {
    const { fixture, element } = await render();
    fixture.componentRef.setInput('returnUrl', undefined);
    type(element, 'email', 'owner@padel.test');
    type(element, 'password', 'secret');
    await fixture.whenStable();

    submitButton(element).click();
    await fixture.whenStable();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('shows the error from the facade and stays on the page', async () => {
    const { fixture, element } = await render();
    login.mockRejectedValue(new Error('Email o contraseña incorrectos'));
    type(element, 'email', 'owner@padel.test');
    type(element, 'password', 'wrong');
    await fixture.whenStable();

    submitButton(element).click();
    await fixture.whenStable();

    expect(element.querySelector('[data-testid="login-error"]')?.textContent?.trim()).toBe(
      'Email o contraseña incorrectos',
    );
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(submitButton(element).disabled).toBe(false);
  });
});

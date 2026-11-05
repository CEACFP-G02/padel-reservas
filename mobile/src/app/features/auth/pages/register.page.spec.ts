import { TestBed } from '@angular/core/testing';
import type { Mock } from 'vitest';
import { Router, provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';

import { AuthFacade } from '../../../core/auth/auth.facade';
import { RegisterRequest } from '../../../shared/models';
import { RegisterPage } from './register.page';

describe('RegisterPage', () => {
  type Register = (request: RegisterRequest) => Promise<void>;
  let register: Mock<Register>;

  function render() {
    TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [provideRouter([]), provideIonicAngular(), { provide: AuthFacade, useValue: { register } }],
    });
    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    return { fixture, page: fixture.componentInstance, navigate, element: fixture.nativeElement as HTMLElement };
  }

  const valid = { name: 'Ana López', email: 'ana@example.com', password: 'secret123', phone: '' };

  beforeEach(() => {
    register = vi.fn<Register>().mockResolvedValue();
  });

  it('shows the Spanish registration form', () => {
    const { element } = render();

    expect(element.querySelector('ion-title')?.textContent).toContain('Crear cuenta');
    const labels = [...element.querySelectorAll('ion-input')].map((input) => input.getAttribute('label'));
    expect(labels).toEqual(['Nombre', 'Email', 'Contraseña', 'Teléfono (opcional)']);
    expect(element.querySelector('ion-button[type="submit"]')?.textContent?.trim()).toBe('Registrarme');
  });

  it('requires a name, a valid email and a password of at least 8 characters', () => {
    const { page } = render();
    const form = page['form'];

    form.setValue({ ...valid, password: 'short' });
    expect(form.invalid).toBe(true);
    form.setValue({ ...valid, email: 'not-an-email' });
    expect(form.invalid).toBe(true);
    form.setValue({ ...valid, name: '  ' });
    expect(form.invalid).toBe(true);
    form.setValue(valid);
    expect(form.valid).toBe(true);
  });

  it('registers through the facade without the empty phone and goes to the availability search', async () => {
    const { page, navigate } = render();
    page['form'].setValue(valid);

    await page['submit']();

    expect(register).toHaveBeenCalledWith({ name: 'Ana López', email: 'ana@example.com', password: 'secret123' });
    expect(navigate).toHaveBeenCalledWith('/tabs/availability');
  });

  it('sends the phone when given', async () => {
    const { page } = render();
    page['form'].setValue({ ...valid, phone: ' 600000000 ' });

    await page['submit']();

    expect(register).toHaveBeenCalledWith({
      name: 'Ana López',
      email: 'ana@example.com',
      password: 'secret123',
      phone: '600000000',
    });
  });

  it('does not submit an invalid form', async () => {
    const { page, navigate } = render();
    page['form'].setValue({ ...valid, password: 'short' });

    await page['submit']();

    expect(register).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows the error (e.g. duplicate email) and stays on the page', async () => {
    register.mockRejectedValue(new Error('Ya existe una cuenta con ese email'));
    const { fixture, page, navigate, element } = render();
    page['form'].setValue(valid);

    await page['submit']();
    await fixture.whenStable();

    expect(element.querySelector('[data-testid="register-error"]')?.textContent?.trim()).toBe(
      'Ya existe una cuenta con ese email',
    );
    expect(navigate).not.toHaveBeenCalled();
    expect(page['submitting']()).toBe(false);
  });
});

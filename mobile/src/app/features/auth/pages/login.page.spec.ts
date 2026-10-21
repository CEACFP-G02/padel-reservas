import { TestBed } from '@angular/core/testing';
import type { Mock } from 'vitest';
import { Router, provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';

import { AuthService } from '../../../core/auth/auth.service';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  type Login = (credentials: { email: string; password: string }) => Promise<void>;
  let login: Mock<Login>;

  function render(returnUrl?: string) {
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([]), provideIonicAngular(), { provide: AuthService, useValue: { login } }],
    });
    const fixture = TestBed.createComponent(LoginPage);
    if (returnUrl) fixture.componentRef.setInput('returnUrl', returnUrl);
    fixture.detectChanges();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const page = fixture.componentInstance;
    page['form'].setValue({ email: 'ana@example.com', password: 'secret123' });
    return { page, navigate };
  }

  beforeEach(() => {
    login = vi.fn<Login>();
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

  it('shows the error and stays on the page when login fails', async () => {
    login.mockImplementation(async () => {
      throw new Error('Credenciales incorrectas');
    });
    const { page, navigate } = render();
    await page['submit']();
    expect(page['error']()).toBe('Credenciales incorrectas');
    expect(navigate).not.toHaveBeenCalled();
  });
});

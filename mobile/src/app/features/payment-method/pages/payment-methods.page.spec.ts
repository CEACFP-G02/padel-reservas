import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AlertController, ToastController, provideIonicAngular } from '@ionic/angular';

import { PaymentMethod } from '../../../shared/models';
import { textOf } from '../../../testing/text';
import { PaymentMethodFacade } from '../payment-method.facade';
import { PaymentMethodsPage } from './payment-methods.page';

describe('PaymentMethodsPage', () => {
  const visa: PaymentMethod = { id: 7, brand: 'VISA', last4: '4242', expiry: '2028-12', default: true };
  const master: PaymentMethod = { id: 8, brand: 'MASTERCARD', last4: '4444', expiry: '2029-01', default: false };

  let facade: {
    methods: ReturnType<typeof signal<PaymentMethod[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    listMethods: ReturnType<typeof vi.fn>;
    addMethod: ReturnType<typeof vi.fn>;
    makeDefault: ReturnType<typeof vi.fn>;
    removeMethod: ReturnType<typeof vi.fn>;
  };
  let alertCreate: ReturnType<typeof vi.fn>;
  let toastCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    facade = {
      methods: signal([visa, master]),
      loading: signal(false),
      error: signal<string | null>(null),
      listMethods: vi.fn().mockResolvedValue(undefined),
      addMethod: vi.fn().mockResolvedValue(true),
      makeDefault: vi.fn().mockResolvedValue(true),
      removeMethod: vi.fn().mockResolvedValue(true),
    };
    alertCreate = vi.fn();
    toastCreate = vi.fn().mockResolvedValue({ present: vi.fn() });
  });

  function render() {
    TestBed.configureTestingModule({
      imports: [PaymentMethodsPage],
      providers: [
        provideRouter([]),
        provideIonicAngular(),
        { provide: PaymentMethodFacade, useValue: facade },
        { provide: AlertController, useValue: { create: alertCreate } },
        { provide: ToastController, useValue: { create: toastCreate } },
      ],
    });
    const fixture = TestBed.createComponent(PaymentMethodsPage);
    fixture.detectChanges();
    return fixture;
  }

  const methodRows = (element: HTMLElement) =>
    (Array.from(element.querySelectorAll('[data-testid="method"]')) as HTMLElement[]).map((e) => textOf(e));
  const rowButton = (element: HTMLElement, row: number, testId: string) =>
    element.querySelectorAll('[data-testid="method"]')[row].querySelector(`[data-testid="${testId}"]`) as HTMLElement | null;
  const alertDismissesWith = (role: string) =>
    alertCreate.mockResolvedValue({ present: vi.fn(), onDidDismiss: vi.fn().mockResolvedValue({ role }) });

  it('lists the cards as brand and last 4 digits, the default first and marked', () => {
    const element = render().nativeElement as HTMLElement;

    expect(facade.listMethods).toHaveBeenCalled();
    expect(methodRows(element)).toEqual([
      'VISA •••• 4242 Caduca 12/2028 Predeterminada Eliminar',
      'MASTERCARD •••• 4444 Caduca 01/2029 Predeterminar Eliminar',
    ]);
  });

  it('shows an empty state without cards', () => {
    facade.methods.set([]);
    const element = render().nativeElement as HTMLElement;

    expect(element.textContent).toContain('Todavía no tienes tarjetas guardadas.');
  });

  it('makes another card the default', async () => {
    const fixture = render();

    rowButton(fixture.nativeElement, 1, 'make-default')!.click();
    await fixture.whenStable();

    expect(facade.makeDefault).toHaveBeenCalledWith(8);
    expect(rowButton(fixture.nativeElement, 0, 'make-default')).toBeNull();
  });

  it('removes a card only after confirming', async () => {
    alertDismissesWith('confirm');
    const fixture = render();

    rowButton(fixture.nativeElement, 0, 'remove')!.click();
    await fixture.whenStable();

    expect(alertCreate).toHaveBeenCalledWith(expect.objectContaining({ header: 'Eliminar tarjeta' }));
    expect(facade.removeMethod).toHaveBeenCalledWith(7);
    expect(toastCreate).toHaveBeenCalledWith(expect.objectContaining({ message: 'Tarjeta eliminada.' }));
  });

  it('does not remove a card when the confirmation is cancelled', async () => {
    alertDismissesWith('cancel');
    const fixture = render();

    rowButton(fixture.nativeElement, 0, 'remove')!.click();
    await fixture.whenStable();

    expect(facade.removeMethod).not.toHaveBeenCalled();
  });

  describe('add a card', () => {
    const card = { cardNumber: '5555 5555 5555 4444', expiry: '2029-01', holder: 'Ana López' };

    it('sends number, expiry and holder, then clears the form so the number is not kept', async () => {
      const fixture = render();
      const page = fixture.componentInstance;
      page['form'].setValue(card);

      await page['add']();

      expect(facade.addMethod).toHaveBeenCalledWith(card);
      expect(page['form'].getRawValue()).toEqual({ cardNumber: '', expiry: '', holder: '' });
      expect(toastCreate).toHaveBeenCalledWith(expect.objectContaining({ message: 'Tarjeta añadida.' }));
    });

    it.each([
      [{ ...card, cardNumber: '' }, 'cardNumber'],
      [{ ...card, cardNumber: '4242 abcd' }, 'cardNumber'],
      [{ ...card, expiry: '12/2029' }, 'expiry'],
      [{ ...card, expiry: '2029-13' }, 'expiry'],
      [{ ...card, holder: '  ' }, 'holder'],
    ])('does not send an invalid card %j', async (value, field) => {
      const fixture = render();
      const page = fixture.componentInstance;
      page['form'].setValue(value);

      await page['add']();

      expect(facade.addMethod).not.toHaveBeenCalled();
      expect(page['form'].controls[field as keyof typeof card].invalid).toBe(true);
    });

    it('keeps the form and shows the error when the API rejects the card', async () => {
      facade.addMethod.mockImplementation(async () => {
        facade.error.set('El número de tarjeta no es válido.');
        return false;
      });
      const fixture = render();
      const page = fixture.componentInstance;
      page['form'].setValue(card);

      await page['add']();
      fixture.detectChanges();

      expect(textOf(fixture.nativeElement.querySelector('[role="alert"]'))).toBe('El número de tarjeta no es válido.');
      expect(page['form'].controls.holder.value).toBe('Ana López');
      expect(toastCreate).not.toHaveBeenCalled();
    });
  });
});

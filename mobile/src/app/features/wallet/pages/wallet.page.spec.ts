import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToastController, provideIonicAngular } from '@ionic/angular';

import { CreditPackOffer, CreditTransaction, PaymentMethod } from '../../../shared/models';
import { textOf } from '../../../testing/text';
import { PaymentMethodFacade } from '../../payment-method/payment-method.facade';
import { WalletFacade } from '../wallet.facade';
import { WalletPage } from './wallet.page';

describe('WalletPage', () => {
  const packs: CreditPackOffer[] = [
    { id: 1, size: 5, price: 75, pricePerReservation: 15 },
    { id: 2, size: 10, price: 140, pricePerReservation: 14 },
    { id: 3, size: 15, price: 195, pricePerReservation: 13 },
    { id: 4, size: 20, price: 240, pricePerReservation: 12 },
  ];
  const transactions: CreditTransaction[] = [
    { id: 32, type: 'CONSUMPTION', credits: -1, amount: null, packSize: null, paymentMethodId: null, createdAt: '2026-06-09T18:00:00Z' },
    { id: 31, type: 'PURCHASE', credits: 10, amount: 140, packSize: 10, paymentMethodId: 7, createdAt: '2026-06-08T10:15:00Z' },
  ];
  const visa: PaymentMethod = { id: 7, brand: 'VISA', last4: '4242', expiry: '2028-12', default: true };
  const master: PaymentMethod = { id: 8, brand: 'MASTERCARD', last4: '4444', expiry: '2029-01', default: false };

  let wallet: {
    balance: ReturnType<typeof signal<number | null>>;
    transactions: ReturnType<typeof signal<CreditTransaction[]>>;
    packs: ReturnType<typeof signal<CreditPackOffer[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    purchaseError: ReturnType<typeof signal<string | null>>;
    loadWallet: ReturnType<typeof vi.fn>;
    buyPack: ReturnType<typeof vi.fn>;
  };
  let methods: ReturnType<typeof signal<PaymentMethod[]>>;
  let listMethods: ReturnType<typeof vi.fn>;
  let toastCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    wallet = {
      balance: signal<number | null>(9),
      transactions: signal(transactions),
      packs: signal(packs),
      loading: signal(false),
      error: signal<string | null>(null),
      purchaseError: signal<string | null>(null),
      loadWallet: vi.fn().mockResolvedValue(undefined),
      buyPack: vi.fn().mockResolvedValue(true),
    };
    methods = signal([visa, master]);
    listMethods = vi.fn().mockResolvedValue(undefined);
    toastCreate = vi.fn().mockResolvedValue({ present: vi.fn() });
  });

  function render() {
    TestBed.configureTestingModule({
      imports: [WalletPage],
      providers: [
        provideRouter([]),
        provideIonicAngular(),
        { provide: WalletFacade, useValue: wallet },
        { provide: PaymentMethodFacade, useValue: { methods, listMethods } },
        { provide: ToastController, useValue: { create: toastCreate } },
      ],
    });
    const fixture = TestBed.createComponent(WalletPage);
    fixture.detectChanges();
    return fixture;
  }

  const all = (element: HTMLElement, testId: string) =>
    (Array.from(element.querySelectorAll(`[data-testid="${testId}"]`)) as HTMLElement[]).map((e) => textOf(e));
  const click = (element: HTMLElement, selector: string) => (element.querySelector(selector) as HTMLElement).click();

  it('loads the wallet and the cards, and shows the balance', () => {
    const fixture = render();
    const element = fixture.nativeElement as HTMLElement;

    expect(wallet.loadWallet).toHaveBeenCalled();
    expect(listMethods).toHaveBeenCalled();
    expect(textOf(element.querySelector('[data-testid="balance"]'))).toBe('9 créditos');
  });

  it('shows the recent transactions in Spanish, most recent first', () => {
    const element = render().nativeElement as HTMLElement;

    expect(all(element, 'transaction')).toEqual([
      'Reserva 9 jun 2026 −1',
      'Compra de pack de 10 8 jun 2026 · 140,00 € +10',
    ]);
  });

  it('lists the four packs with price and price per reservation', () => {
    const element = render().nativeElement as HTMLElement;

    expect(all(element, 'pack')).toEqual([
      '5 reservas 15,00 € / reserva 75,00 €',
      '10 reservas 14,00 € / reserva 140,00 €',
      '15 reservas 13,00 € / reserva 195,00 €',
      '20 reservas 12,00 € / reserva 240,00 €',
    ]);
  });

  it('buys the chosen pack with the default card and confirms it', async () => {
    const fixture = render();
    const element = fixture.nativeElement as HTMLElement;
    expect((element.querySelector('[data-testid="buy"]') as HTMLButtonElement).disabled).toBe(true);

    click(element, '[data-testid="pack"]:nth-of-type(2)');
    fixture.detectChanges();
    click(element, '[data-testid="buy"]');
    await fixture.whenStable();

    expect(wallet.buyPack).toHaveBeenCalledWith(2, 7);
    expect(toastCreate).toHaveBeenCalledWith(expect.objectContaining({ message: '¡Listo! Has añadido 10 créditos.' }));
  });

  it('buys with another card when the client picks it', async () => {
    const fixture = render();
    const element = fixture.nativeElement as HTMLElement;

    fixture.componentInstance['packId'].set(1);
    fixture.componentInstance['cardId'].set(8);
    fixture.detectChanges();
    click(element, '[data-testid="buy"]');
    await fixture.whenStable();

    expect(wallet.buyPack).toHaveBeenCalledWith(1, 8);
  });

  it('shows "Pago rechazado" when the card is declined', async () => {
    wallet.buyPack.mockImplementation(async () => {
      wallet.purchaseError.set('Pago rechazado: no se han añadido créditos. Prueba con otra tarjeta.');
      return false;
    });
    const fixture = render();
    const element = fixture.nativeElement as HTMLElement;

    fixture.componentInstance['packId'].set(2);
    fixture.detectChanges();
    click(element, '[data-testid="buy"]');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(textOf(element.querySelector('[data-testid="purchase-error"]'))).toBe(
      'Pago rechazado: no se han añadido créditos. Prueba con otra tarjeta.',
    );
    expect(toastCreate).not.toHaveBeenCalled();
  });

  it('without cards, asks to add one before buying', () => {
    methods.set([]);
    const fixture = render();
    const element = fixture.nativeElement as HTMLElement;
    fixture.componentInstance['packId'].set(2);
    fixture.detectChanges();

    expect(element.textContent).toContain('Añade una tarjeta para comprar créditos.');
    expect((element.querySelector('[data-testid="buy"]') as HTMLButtonElement).disabled).toBe(true);
  });

  it('links to the saved cards', () => {
    const element = render().nativeElement as HTMLElement;

    expect(element.querySelector('[data-testid="cards-link"]')?.getAttribute('routerLink')).toBe('cards');
    expect(textOf(element.querySelector('[data-testid="cards-link"]'))).toContain('Mis tarjetas');
  });
});

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CreditPackOffer, CreditTransaction } from '../../shared/models';
import { WalletApi } from './wallet.api';

/** How many recent movements the wallet shows. */
const RECENT_TRANSACTIONS = 10;

const PURCHASE_ERRORS: Record<number, string> = {
  402: 'Pago rechazado: no se han añadido créditos. Prueba con otra tarjeta.',
  404: 'Ese pack o esa tarjeta ya no están disponibles. Vuelve a cargar el monedero.',
};

/** CLIENT use cases on their credit (1 credit = 1 prepaid reservation). */
@Injectable({ providedIn: 'root' })
export class WalletFacade {
  private readonly api = inject(WalletApi);

  private readonly _balance = signal<number | null>(null);
  private readonly _transactions = signal<CreditTransaction[]>([]);
  private readonly _packs = signal<CreditPackOffer[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _purchaseError = signal<string | null>(null);

  /** Credits left; `null` until loaded. */
  readonly balance = this._balance.asReadonly();
  readonly transactions = this._transactions.asReadonly();
  readonly packs = this._packs.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly purchaseError = this._purchaseError.asReadonly();

  /** UC: See my wallet — balance, recent transactions and the packs on sale. */
  async loadWallet(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const [{ balance }, page, packs] = await Promise.all([
        firstValueFrom(this.api.balance()),
        firstValueFrom(this.api.transactions({ page: 0, size: RECENT_TRANSACTIONS })),
        firstValueFrom(this.api.packs()),
      ]);
      this._balance.set(balance);
      this._transactions.set(page.content);
      this._packs.set(
        packs.map((pack) => ({ ...pack, pricePerReservation: Math.round((pack.price / pack.size) * 100) / 100 })),
      );
    } catch {
      this._error.set('No se pudo cargar tu monedero.');
    } finally {
      this._loading.set(false);
    }
  }

  /** Reloads the balance only (e.g. before and after paying a booking). Keeps the last one on failure. */
  async refreshBalance(): Promise<void> {
    try {
      this._balance.set((await firstValueFrom(this.api.balance())).balance);
    } catch {
      // The last known balance stays; the server decides the real split anyway.
    }
  }

  /** UC: Buy a credit pack with one of my cards. Resolves to `false` on failure, with `purchaseError` set. */
  async buyPack(packId: number, paymentMethodId: number): Promise<boolean> {
    this._loading.set(true);
    this._purchaseError.set(null);
    try {
      const { balance, transaction } = await firstValueFrom(this.api.purchase({ packId, paymentMethodId }));
      this._balance.set(balance);
      this._transactions.update((transactions) => [transaction, ...transactions].slice(0, RECENT_TRANSACTIONS));
      return true;
    } catch (err) {
      const status = err instanceof HttpErrorResponse ? err.status : 0;
      this._purchaseError.set(PURCHASE_ERRORS[status] ?? 'No se pudo completar la compra.');
      return false;
    } finally {
      this._loading.set(false);
    }
  }
}

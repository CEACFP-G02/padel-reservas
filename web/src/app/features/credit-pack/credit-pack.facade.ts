import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiError, CreditPack } from '../../shared/models';
import { CreditPackApi } from './credit-pack.api';

/** A pack as listed: with its price per reservation (EUR, rounded to cents). */
export interface CreditPackRow extends CreditPack {
  pricePerReservation: number;
}

export const PRICE_RULE = 'El precio debe ser mayor o igual que 0, con 2 decimales como máximo.';

/** A failed price update, with Spanish messages for the form. */
export class CreditPackError extends Error {
  constructor(
    message: string,
    readonly fieldErrors: Partial<Record<'price', string>> = {},
  ) {
    super(message);
  }
}

/** Maps the documented errors (docs/api.md#credit-packs--apiv1credit-packs) to Spanish. */
function creditPackErrorOf(error: unknown): CreditPackError {
  const status = error instanceof HttpErrorResponse ? error.status : undefined;
  if (status === 400) {
    const apiFields = ((error as HttpErrorResponse).error as ApiError | null)?.fieldErrors ?? {};
    return new CreditPackError(
      'Revisa el precio del pack.',
      'price' in apiFields ? { price: PRICE_RULE } : {},
    );
  }
  if (status === 404) {
    return new CreditPackError('El pack ya no existe.');
  }
  return new CreditPackError('No se pudo guardar el precio.');
}

export function pricePerReservation(price: number, size: number): number {
  return Math.round((price / size) * 100) / 100;
}

/** OWNER use cases on credit packs. One method per use case; state lives in signals. */
@Injectable({ providedIn: 'root' })
export class CreditPackFacade {
  private readonly api = inject(CreditPackApi);

  private readonly _packs = signal<CreditPack[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly packs = computed<CreditPackRow[]>(() =>
    this._packs().map((pack) => ({
      ...pack,
      pricePerReservation: pricePerReservation(pack.price, pack.size),
    })),
  );
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** UC: List credit packs (the four of them, by size). */
  async listPacks(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      this._packs.set(await firstValueFrom(this.api.list()));
    } catch {
      this._packs.set([]);
      this._error.set('No se pudieron cargar los packs de crédito.');
    } finally {
      this._loading.set(false);
    }
  }

  refresh(): Promise<void> {
    return this.listPacks();
  }

  /** UC: Update a credit pack's price. Rejects with a {@link CreditPackError}. */
  async updatePrice(id: number, price: number): Promise<CreditPack> {
    let saved: CreditPack;
    try {
      saved = await firstValueFrom(this.api.updatePrice(id, price));
    } catch (error) {
      throw creditPackErrorOf(error);
    }
    this._packs.update((packs) => packs.map((pack) => (pack.id === saved.id ? saved : pack)));
    return saved;
  }
}

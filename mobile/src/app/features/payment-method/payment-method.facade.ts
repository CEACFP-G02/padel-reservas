import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

import { AddPaymentMethodRequest, ApiError, PaymentMethod } from '../../shared/models';
import { PaymentMethodApi } from './payment-method.api';

/** Spanish for the documented 400 messages of POST /payment-methods (the number is never echoed back). */
const CARD_ERRORS: Record<string, string> = {
  'Invalid card number': 'El número de tarjeta no es válido.',
  'Card expired': 'La tarjeta está caducada.',
};

function errorOf(err: unknown, fallback: string): string {
  if (!(err instanceof HttpErrorResponse)) {
    return fallback;
  }
  if (err.status === 400) {
    return CARD_ERRORS[(err.error as ApiError | null)?.message ?? ''] ?? 'Revisa los datos de la tarjeta.';
  }
  if (err.status === 404) {
    return 'Esa tarjeta ya no existe.';
  }
  return fallback;
}

/** The default first, then in the order they were added (like the API). */
const byDefaultFirst = (methods: PaymentMethod[]): PaymentMethod[] =>
  [...methods].sort((a, b) => Number(b.default) - Number(a.default));

/**
 * CLIENT use cases on their saved cards. Only what the API returns is kept (brand, last 4, expiry): the full
 * card number is sent once, on add, and never stored.
 */
@Injectable({ providedIn: 'root' })
export class PaymentMethodFacade {
  private readonly api = inject(PaymentMethodApi);

  private readonly _methods = signal<PaymentMethod[]>([]);
  private readonly _loaded = signal(false);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly methods = this._methods.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly defaultMethod = computed(() => this._methods().find((method) => method.default) ?? null);

  /** UC: List my cards. */
  async listMethods(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      this._methods.set(byDefaultFirst(await firstValueFrom(this.api.list())));
      this._loaded.set(true);
    } catch {
      this._error.set('No se pudieron cargar tus tarjetas.');
    } finally {
      this._loading.set(false);
    }
  }

  /** UC: Add a card. Resolves to `false` on failure, with `error` set in Spanish. */
  async addMethod(card: AddPaymentMethodRequest): Promise<boolean> {
    const added = await this.write(this.api.add(card), 'No se pudo añadir la tarjeta.');
    if (added) {
      this._methods.update((methods) => byDefaultFirst([...methods, added]));
    }
    return added !== null;
  }

  /** UC: Make a card my default. */
  async makeDefault(id: number): Promise<boolean> {
    const updated = await this.write(this.api.makeDefault(id), 'No se pudo cambiar la tarjeta predeterminada.');
    if (updated) {
      this._methods.update((methods) =>
        byDefaultFirst(methods.map((method) => (method.id === id ? updated : { ...method, default: false }))),
      );
    }
    return updated !== null;
  }

  /** UC: Remove a card. */
  async removeMethod(id: number): Promise<boolean> {
    const removed = await this.write(this.api.remove(id), 'No se pudo eliminar la tarjeta.');
    if (removed !== null) {
      this._methods.update((methods) => methods.filter((method) => method.id !== id));
    }
    return removed !== null;
  }

  /** Runs a write; resolves to its result (`undefined` for a 204), or `null` with `error` set. */
  private async write<T>(request: Observable<T>, fallback: string): Promise<T | null> {
    this._loading.set(true);
    this._error.set(null);
    try {
      // A 204 has a null body: map it to `undefined` so only a failure is `null`.
      return (await firstValueFrom(request)) ?? (undefined as T);
    } catch (err) {
      this._error.set(errorOf(err, fallback));
      return null;
    } finally {
      this._loading.set(false);
    }
  }
}

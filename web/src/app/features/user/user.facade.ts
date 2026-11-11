import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

import {
  ApiError,
  Booking,
  Client,
  ClientQuery,
  CreateClientRequest,
  PageMeta,
  PageRequest,
  UpdateClientRequest,
} from '../../shared/models';
import { UserApi } from './user.api';

export type ClientField = 'name' | 'email' | 'password' | 'phone';

/** A failed client write, with Spanish messages for the form. */
export class ClientError extends Error {
  constructor(
    message: string,
    readonly fieldErrors: Partial<Record<ClientField, string>> = {},
  ) {
    super(message);
  }
}

const DUPLICATE_EMAIL = 'Ya existe un usuario con ese email.';
/** `/users/{id}` and `/users/{id}/bookings` answer 404 for an unknown id or a non-client. */
const NOT_A_CLIENT = 'Ese cliente no existe.';

const isNotFound = (error: unknown) => error instanceof HttpErrorResponse && error.status === 404;

const FIELD_MESSAGES: Record<ClientField, string> = {
  name: 'El nombre es obligatorio (máximo 200 caracteres).',
  email: 'Introduce un email válido.',
  password: 'La contraseña debe tener entre 8 y 72 caracteres.',
  phone: 'El teléfono admite como máximo 30 caracteres.',
};

/** Maps the documented errors (docs/api.md#users--clients--apiv1users) to Spanish. */
function clientErrorOf(error: unknown): ClientError {
  const status = error instanceof HttpErrorResponse ? error.status : undefined;
  if (status === 409) {
    return new ClientError('Revisa los datos del cliente.', { email: DUPLICATE_EMAIL });
  }
  if (status === 404) {
    return new ClientError('El cliente ya no existe.');
  }
  if (status === 400) {
    const apiFields = ((error as HttpErrorResponse).error as ApiError | null)?.fieldErrors ?? {};
    const fieldErrors = Object.fromEntries(
      Object.keys(apiFields)
        .filter((field): field is ClientField => field in FIELD_MESSAGES)
        .map((field) => [field, FIELD_MESSAGES[field]]),
    );
    return new ClientError('Revisa los datos del cliente.', fieldErrors);
  }
  return new ClientError('No se pudo guardar el cliente.');
}

/** OWNER use cases on client accounts. */
@Injectable({ providedIn: 'root' })
export class UserFacade {
  private readonly api = inject(UserApi);

  private readonly _clients = signal<Client[]>([]);
  private readonly _page = signal<PageMeta | null>(null);
  private readonly _filters = signal<ClientQuery>({});
  private readonly _selected = signal<Client | null>(null);
  private readonly _clientBookings = signal<Booking[]>([]);
  private readonly _clientBookingsPage = signal<PageMeta | null>(null);
  private readonly _clientBookingsLoading = signal(false);
  private readonly _clientBookingsError = signal<string | null>(null);
  private readonly _selectedError = signal<string | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly clients = this._clients.asReadonly();
  readonly page = this._page.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly clientBookings = this._clientBookings.asReadonly();
  readonly clientBookingsPage = this._clientBookingsPage.asReadonly();
  readonly clientBookingsLoading = this._clientBookingsLoading.asReadonly();
  readonly clientBookingsError = this._clientBookingsError.asReadonly();
  /** Why the last getClient failed, in Spanish. */
  readonly selectedError = this._selectedError.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** UC: List clients (search + pagination), active and inactive. */
  async listClients(query: ClientQuery = {}): Promise<void> {
    this._filters.set(query);
    this._loading.set(true);
    this._error.set(null);
    try {
      const { content, ...meta } = await firstValueFrom(this.api.list(query));
      this._clients.set(content);
      this._page.set(meta);
    } catch {
      this._clients.set([]);
      this._page.set(null);
      this._error.set('No se pudieron cargar los clientes.');
    } finally {
      this._loading.set(false);
    }
  }

  /** Reloads the list with the last query. */
  refresh(): Promise<void> {
    return this.listClients(this._filters());
  }

  /** UC: Get client. */
  async getClient(id: number): Promise<void> {
    this._selectedError.set(null);
    try {
      this._selected.set(await firstValueFrom(this.api.get(id)));
    } catch (error) {
      this._selected.set(null);
      this._selectedError.set(isNotFound(error) ? NOT_A_CLIENT : 'No se pudo cargar el cliente.');
    }
  }

  /** UC: Create client. Rejects with a {@link ClientError}. */
  async createClient(request: CreateClientRequest): Promise<Client> {
    const client = await this.write(this.api.create(request));
    this._clients.update((clients) => [...clients, client]);
    return client;
  }

  /** UC: Update client (PATCH: only the changed fields). Rejects with a {@link ClientError}. */
  async updateClient(id: number, request: UpdateClientRequest): Promise<Client> {
    const client = await this.write(this.api.update(id, request));
    this._clients.update((clients) => clients.map((c) => (c.id === id ? client : c)));
    if (this._selected()?.id === id) {
      this._selected.set(client);
    }
    return client;
  }

  /**
   * UC: Delete client. The server deactivates a client with bookings and deletes one without, so the caller
   * refreshes the list afterwards. Rejects with a {@link ClientError}.
   */
  async deleteClient(id: number): Promise<void> {
    await this.write(this.api.delete(id));
  }

  /** UC: List a client's bookings. */
  async listClientBookings(id: number, page: PageRequest = {}): Promise<void> {
    this._clientBookingsLoading.set(true);
    this._clientBookingsError.set(null);
    try {
      const { content, ...meta } = await firstValueFrom(this.api.bookings(id, page));
      this._clientBookings.set(content);
      this._clientBookingsPage.set(meta);
    } catch (error) {
      this._clientBookings.set([]);
      this._clientBookingsPage.set(null);
      this._clientBookingsError.set(
        isNotFound(error) ? NOT_A_CLIENT : 'No se pudieron cargar las reservas del cliente.',
      );
    } finally {
      this._clientBookingsLoading.set(false);
    }
  }

  private async write<T>(request: Observable<T>): Promise<T> {
    try {
      return await firstValueFrom(request);
    } catch (error) {
      throw clientErrorOf(error);
    }
  }
}

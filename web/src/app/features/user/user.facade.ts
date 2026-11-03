import { Injectable, inject, signal } from '@angular/core';

import {
  Booking,
  ClientQuery,
  CreateClientRequest,
  PageMeta,
  PageRequest,
  UpdateClientRequest,
  User,
} from '../../shared/models';
import { todo } from '../../shared/util/todo';
import { UserApi } from './user.api';

/** OWNER use cases on client accounts. */
@Injectable({ providedIn: 'root' })
export class UserFacade {
  private readonly api = inject(UserApi);

  private readonly _clients = signal<User[]>([]);
  private readonly _page = signal<PageMeta | null>(null);
  private readonly _selected = signal<User | null>(null);
  private readonly _clientBookings = signal<Booking[]>([]);
  private readonly _clientBookingsPage = signal<PageMeta | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly clients = this._clients.asReadonly();
  readonly page = this._page.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly clientBookings = this._clientBookings.asReadonly();
  readonly clientBookingsPage = this._clientBookingsPage.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** UC: List clients (search + pagination). */
  async listClients(query: ClientQuery = {}): Promise<void> {
    // TODO: api.list(query) -> _clients.set(page.content), _page.set(meta) — see docs/api.md#users--clients--apiv1users
    todo('UserFacade.listClients', 'users--clients--apiv1users');
  }

  /** UC: Get client. */
  async getClient(id: number): Promise<void> {
    // TODO: api.get(id) -> _selected — see docs/api.md#users--clients--apiv1users
    todo('UserFacade.getClient', 'users--clients--apiv1users');
  }

  /** UC: Create client. */
  async createClient(request: CreateClientRequest): Promise<void> {
    // TODO: api.create(request) -> append to _clients (409/400 on duplicate email)
    //  — see docs/api.md#users--clients--apiv1users
    todo('UserFacade.createClient', 'users--clients--apiv1users');
  }

  /** UC: Update client (PATCH: only the changed fields). */
  async updateClient(id: number, request: UpdateClientRequest): Promise<void> {
    // TODO: api.update(id, request) -> replace in _clients / _selected — see docs/api.md#users--clients--apiv1users
    todo('UserFacade.updateClient', 'users--clients--apiv1users');
  }

  /** UC: Delete client. */
  async deleteClient(id: number): Promise<void> {
    // TODO: api.delete(id) -> drop from _clients — see docs/api.md#users--clients--apiv1users
    todo('UserFacade.deleteClient', 'users--clients--apiv1users');
  }

  /** UC: List a client's bookings. */
  async listClientBookings(id: number, page: PageRequest = {}): Promise<void> {
    // TODO: api.bookings(id, page) -> _clientBookings.set(page.content), _clientBookingsPage.set(meta)
    //  — see docs/api.md#users--clients--apiv1users
    todo('UserFacade.listClientBookings', 'users--clients--apiv1users');
  }
}

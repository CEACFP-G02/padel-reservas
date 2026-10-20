import { Injectable, inject, signal } from '@angular/core';

import { CreateClientRequest, UpdateClientRequest, User } from '../../shared/models';
import { todo } from '../../shared/util/todo';
import { UserApi } from './user.api';

/** OWNER use cases on client accounts. */
@Injectable({ providedIn: 'root' })
export class UserFacade {
  private readonly api = inject(UserApi);

  private readonly _clients = signal<User[]>([]);
  private readonly _selected = signal<User | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly clients = this._clients.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** UC: List clients. */
  async listClients(): Promise<void> {
    // TODO: api.list() -> _clients — see docs/api.md#get-apiv1users
    todo('UserFacade.listClients', 'get-apiv1users');
  }

  /** UC: Get client. */
  async getClient(id: number): Promise<void> {
    // TODO: api.get(id) -> _selected — see docs/api.md#get-apiv1usersid
    todo('UserFacade.getClient', 'get-apiv1usersid');
  }

  /** UC: Create client. */
  async createClient(request: CreateClientRequest): Promise<void> {
    // TODO: api.create(request) -> append to _clients (409/400 on duplicate email) — see docs/api.md#post-apiv1users
    todo('UserFacade.createClient', 'post-apiv1users');
  }

  /** UC: Update client. */
  async updateClient(id: number, request: UpdateClientRequest): Promise<void> {
    // TODO: api.update(id, request) -> replace in _clients / _selected — see docs/api.md#put-apiv1usersid
    todo('UserFacade.updateClient', 'put-apiv1usersid');
  }

  /** UC: Delete client. */
  async deleteClient(id: number): Promise<void> {
    // TODO: api.delete(id) -> drop from _clients — see docs/api.md#delete-apiv1usersid
    todo('UserFacade.deleteClient', 'delete-apiv1usersid');
  }
}

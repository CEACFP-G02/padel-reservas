import { PageRequest } from './common';
import { Role } from './enums';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
}

/** A client as the owner manages it (`/users`). `active: false` = removed but kept for its bookings. */
export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  active: boolean;
}

export interface CreateClientRequest {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
}

/** PATCH: only the fields that change; `phone: ''` clears it, `active: true` reactivates. */
export type UpdateClientRequest = Partial<Pick<Client, 'name' | 'email' | 'phone' | 'active'>>;

export interface ClientQuery extends PageRequest {
  search?: string;
}

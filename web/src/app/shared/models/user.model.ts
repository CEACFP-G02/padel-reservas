import { PageRequest } from './common';
import { Role } from './enums';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
}

export interface CreateClientRequest {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
}

/** PATCH: only the fields that change. */
export type UpdateClientRequest = Partial<Pick<User, 'name' | 'email' | 'phone'>>;

export interface ClientQuery extends PageRequest {
  search?: string;
}

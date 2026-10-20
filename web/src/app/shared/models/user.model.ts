import { IsoDateTime } from './common';
import { Role } from './enums';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
  active: boolean;
  createdAt: IsoDateTime;
}

export interface CreateClientRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

export interface UpdateClientRequest {
  firstName: string;
  lastName: string;
  phone?: string | null;
  active: boolean;
}

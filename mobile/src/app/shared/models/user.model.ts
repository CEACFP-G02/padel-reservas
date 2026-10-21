import { Role } from './enums';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
}

/** PATCH /auth/me — only the fields being changed. */
export interface UpdateProfileRequest {
  name?: string;
  phone?: string | null;
}

import { User } from './user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

/** Client self sign-up (mobile app); answers `201` + the created user. */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

/** PATCH /auth/me: only the fields that change. */
export type UpdateProfileRequest = Partial<Pick<User, 'name' | 'phone'>>;

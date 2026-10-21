import { Injectable, inject, signal } from '@angular/core';

import { AuthService } from '../../core/auth/auth.service';
import { UpdateProfileRequest, User } from '../../shared/models';
import { todo } from '../../shared/util/todo';
import { ProfileApi } from './profile.api';

/** CLIENT use cases on the client's own profile. */
@Injectable({ providedIn: 'root' })
export class ProfileFacade {
  private readonly api = inject(ProfileApi);
  private readonly auth = inject(AuthService);

  private readonly _profile = signal<User | null>(null);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly profile = this._profile.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();

  /** UC: Get current user. */
  async getCurrentUser(): Promise<void> {
    // TODO: api.getMe() -> _profile + auth.setCurrentUser(user) — see docs/api.md#auth--apiv1auth
    todo('ProfileFacade.getCurrentUser', 'auth--apiv1auth');
  }

  /** UC: Update profile (PATCH /auth/me). */
  async updateProfile(request: UpdateProfileRequest): Promise<void> {
    // TODO: api.updateMe(request) -> _profile + auth.setCurrentUser(user) — see docs/api.md#users--clients--apiv1users
    todo('ProfileFacade.updateProfile', 'users--clients--apiv1users');
  }
}

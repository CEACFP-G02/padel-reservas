import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ProfileFacade } from './profile.facade';

describe('ProfileFacade', () => {
  let facade: ProfileFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    facade = TestBed.inject(ProfileFacade);
  });

  it('starts with no profile loaded', () => {
    expect(facade.profile()).toBeNull();
    expect(facade.saving()).toBe(false);
  });

  it.todo('getCurrentUser loads /auth/me and publishes it to AuthService');
  it.todo('updateProfile PATCHes /auth/me and refreshes the profile');
});

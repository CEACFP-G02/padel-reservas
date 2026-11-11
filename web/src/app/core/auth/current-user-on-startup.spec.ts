import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { appConfig } from '../../app.config';
import { Role, User } from '../../shared/models';
import { API } from '../../testing/http';
import { AuthFacade } from './auth.facade';
import { provideCurrentUserOnStartup } from './current-user-on-startup';
import { writeTokens } from './token-storage';

const owner: User = {
  id: 1,
  name: 'Dueño',
  email: 'owner@padel.test',
  phone: null,
  role: Role.OWNER,
};

describe('provideCurrentUserOnStartup', () => {
  let http: HttpTestingController;

  async function start(): Promise<AuthFacade> {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideCurrentUserOnStartup(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    await TestBed.inject(ApplicationInitStatus).donePromise;
    return TestBed.inject(AuthFacade);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => http.verify());

  it('loads the current user at startup when a token is stored (e.g. after a full reload)', async () => {
    writeTokens({ accessToken: 'stored-access', refreshToken: 'stored-refresh' });
    const auth = await start();

    http.expectOne(`${API}/auth/me`).flush(owner);
    await Promise.resolve();

    expect(auth.currentUser()).toEqual(owner);
  });

  it('does not block startup on the profile request', async () => {
    writeTokens({ accessToken: 'stored-access', refreshToken: 'stored-refresh' });
    const auth = await start();

    // Initialisation finished while /auth/me is still pending.
    const req = http.expectOne(`${API}/auth/me`);
    expect(auth.currentUser()).toBeNull();
    req.flush(owner);
  });

  it('does nothing when there is no stored session', async () => {
    const auth = await start();

    http.expectNone(`${API}/auth/me`);
    expect(auth.currentUser()).toBeNull();
  });

  it('handles a failed profile request (the interceptor and guard handle the session)', async () => {
    writeTokens({ accessToken: 'stored-access', refreshToken: 'stored-refresh' });
    const failure = Promise.reject(new Error('profile unavailable'));
    const handled = vi.spyOn(failure, 'catch');
    vi.spyOn(AuthFacade.prototype, 'loadCurrentUser').mockReturnValue(failure);

    const auth = await start();

    expect(auth.loadCurrentUser).toHaveBeenCalledTimes(1);
    expect(handled).toHaveBeenCalledTimes(1);
    await expect(handled.mock.results[0].value).resolves.toBeUndefined();
    vi.restoreAllMocks();
  });

  it('is registered in the app config', async () => {
    writeTokens({ accessToken: 'stored-access', refreshToken: 'stored-refresh' });
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    await TestBed.inject(ApplicationInitStatus).donePromise;

    http.expectOne(`${API}/auth/me`).flush(owner);
    await Promise.resolve();

    expect(TestBed.inject(AuthFacade).currentUser()).toEqual(owner);
  });
});

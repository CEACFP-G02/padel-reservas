import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';

import { Role } from '../../shared/models';
import { fakeJwt } from '../../testing/fake-jwt';
import { clientGuard } from './client.guard';
import { writeTokens } from './token-storage';

describe('clientGuard', () => {
  const state = { url: '/tabs/bookings' } as RouterStateSnapshot;

  function run(): boolean | UrlTree {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    return TestBed.runInInjectionContext(
      () => clientGuard({} as ActivatedRouteSnapshot, state) as boolean | UrlTree,
    );
  }

  function serialize(result: boolean | UrlTree): string {
    return TestBed.inject(Router).serializeUrl(result as UrlTree);
  }

  beforeEach(() => localStorage.clear());

  it('lets a CLIENT through', () => {
    writeTokens({ accessToken: fakeJwt({ role: Role.CLIENT }), refreshToken: 'refresh' });
    expect(run()).toBe(true);
  });

  it('redirects anonymous users to /login with returnUrl', () => {
    expect(serialize(run())).toBe('/login?returnUrl=%2Ftabs%2Fbookings');
  });

  it('redirects an OWNER to /login', () => {
    writeTokens({ accessToken: fakeJwt({ role: Role.OWNER }), refreshToken: 'refresh' });
    expect(serialize(run())).toBe('/login?returnUrl=%2Ftabs%2Fbookings');
  });
});

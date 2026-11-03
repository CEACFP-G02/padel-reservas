import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';

import { AuthFacade } from './auth.facade';
import { ownerGuard } from './owner.guard';

describe('ownerGuard', () => {
  function run(isOwner: boolean, url = '/courts') {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthFacade, useValue: { isOwner: signal(isOwner) } }],
    });
    return TestBed.runInInjectionContext(() =>
      ownerGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );
  }

  it('lets an OWNER into the admin panel', () => {
    expect(run(true)).toBe(true);
  });

  it('redirects a CLIENT or an unauthenticated user to /login, remembering the target', () => {
    const result = run(false, '/bookings/7');

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fbookings%2F7');
  });
});

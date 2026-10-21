import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ProfileApi } from './profile.api';

describe('ProfileApi', () => {
  const me = `${environment.apiBaseUrl}/auth/me`;
  let api: ProfileApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(ProfileApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getMe GETs /auth/me', () => {
    api.getMe().subscribe();
    expect(http.expectOne(me).request.method).toBe('GET');
  });

  it('updateMe PATCHes /auth/me with only the changed fields', () => {
    api.updateMe({ phone: '600000000' }).subscribe();
    const req = http.expectOne(me);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ phone: '600000000' });
  });
});

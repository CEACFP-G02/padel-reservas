import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../environments/environment';
import { jwtInterceptor } from './jwt.interceptor';
import { writeTokens } from './token-storage';

describe('jwtInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  function setup(): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => controller.verify());

  it('adds the bearer token to API requests', () => {
    writeTokens({ accessToken: 'access', refreshToken: 'refresh' });
    setup();
    http.get(`${environment.apiBaseUrl}/courts`).subscribe();
    const req = controller.expectOne(`${environment.apiBaseUrl}/courts`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer access');
  });

  it('sends no header when signed out', () => {
    setup();
    http.get(`${environment.apiBaseUrl}/courts`).subscribe();
    expect(controller.expectOne(`${environment.apiBaseUrl}/courts`).request.headers.has('Authorization')).toBe(false);
  });

  it('never sends the token to other hosts', () => {
    writeTokens({ accessToken: 'access', refreshToken: 'refresh' });
    setup();
    http.get('https://example.com/data').subscribe();
    expect(controller.expectOne('https://example.com/data').request.headers.has('Authorization')).toBe(false);
  });
});

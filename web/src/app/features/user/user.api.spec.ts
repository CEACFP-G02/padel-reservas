import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Booking, PageResponse, Role, User } from '../../shared/models';
import { bookingFixture } from '../../testing/fixtures';
import { API, pageOf, setUpHttp } from '../../testing/http';
import { UserApi } from './user.api';

describe('UserApi', () => {
  const client: User = { id: 42, name: 'Ana López', email: 'ana@padel.test', phone: '600000000', role: Role.CLIENT };
  let api: UserApi;
  let http: HttpTestingController;

  beforeEach(() => {
    http = setUpHttp();
    api = TestBed.inject(UserApi);
  });

  afterEach(() => http.verify());

  it('list GETs /users with search and pagination, returning a page', () => {
    let page: PageResponse<User> | undefined;
    api.list({ search: 'ana', page: 2, size: 10 }).subscribe((p) => (page = p));

    const req = http.expectOne((r) => r.url === `${API}/users`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.toString()).toBe('search=ana&page=2&size=10');
    req.flush(pageOf([client], 2, 10));

    expect(page?.content).toEqual([client]);
  });

  it('get GETs /users/{id}', () => {
    api.get(42).subscribe();
    expect(http.expectOne(`${API}/users/42`).request.method).toBe('GET');
  });

  it('create POSTs { name, email, password, phone }', () => {
    const body = { name: 'Ana López', email: 'ana@padel.test', password: 's3cret-pass', phone: '600000000' };
    api.create(body).subscribe();

    const req = http.expectOne(`${API}/users`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
  });

  it('update PATCHes /users/{id} with the changed fields', () => {
    api.update(42, { phone: '611111111' }).subscribe();

    const req = http.expectOne(`${API}/users/42`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ phone: '611111111' });
  });

  it('delete DELETEs /users/{id}', () => {
    api.delete(42).subscribe();
    expect(http.expectOne(`${API}/users/42`).request.method).toBe('DELETE');
  });

  it('bookings GETs /users/{id}/bookings paginated', () => {
    let page: PageResponse<Booking> | undefined;
    api.bookings(42, { page: 0, size: 5 }).subscribe((p) => (page = p));

    const req = http.expectOne((r) => r.url === `${API}/users/42/bookings`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.toString()).toBe('page=0&size=5');
    req.flush(pageOf([bookingFixture], 0, 5));

    expect(page?.content).toEqual([bookingFixture]);
  });
});

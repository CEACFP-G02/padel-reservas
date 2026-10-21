import { fakeJwt } from '../../testing/fake-jwt';
import { clearTokens, decodeJwtPayload, readTokens, writeTokens } from './token-storage';

describe('token-storage', () => {
  beforeEach(() => localStorage.clear());

  it('returns null when nothing is stored', () => {
    expect(readTokens()).toBeNull();
  });

  it('round-trips the token pair', () => {
    writeTokens({ accessToken: 'access', refreshToken: 'refresh' });
    expect(readTokens()).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
  });

  it('clears both tokens', () => {
    writeTokens({ accessToken: 'access', refreshToken: 'refresh' });
    clearTokens();
    expect(readTokens()).toBeNull();
  });

  it('decodes the JWT payload', () => {
    expect(decodeJwtPayload(fakeJwt({ sub: 'ana@example.com', role: 'CLIENT' }))).toEqual({
      sub: 'ana@example.com',
      role: 'CLIENT',
    });
  });

  it('returns null for a malformed token', () => {
    expect(decodeJwtPayload('not-a-jwt')).toBeNull();
  });
});

import { toHttpParams } from './http-params';

describe('toHttpParams', () => {
  it('sends set values (including false and 0) and skips undefined/null/empty', () => {
    const params = toHttpParams({ page: 0, size: 20, active: false, search: '', date: undefined, courtId: null });

    expect(params.keys()).toEqual(['page', 'size', 'active']);
    expect(params.get('page')).toBe('0');
    expect(params.get('active')).toBe('false');
  });
});

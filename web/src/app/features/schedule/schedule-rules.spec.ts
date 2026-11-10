import { rangeErrors } from './schedule-rules';

describe('rangeErrors', () => {
  it('accepts valid ranges, including touching ranges on the same day', () => {
    expect(
      rangeErrors(
        [
          { day: 'MONDAY', open: '10:00', close: '14:00' },
          { day: 'MONDAY', open: '14:00', close: '20:00' },
          { day: 'TUESDAY', open: '10:00', close: '14:00' },
        ],
        60,
      ),
    ).toEqual([null, null, null]);
  });

  it('requires a day, an opening and a closing time', () => {
    expect(rangeErrors([{ day: null, open: '08:00', close: '' }], 60)).toEqual([
      'Indica el día, la apertura y el cierre.',
    ]);
  });

  it('rejects a range that does not close after it opens', () => {
    expect(rangeErrors([{ day: 'MONDAY', open: '14:00', close: '14:00' }], 60)).toEqual([
      'El cierre debe ser posterior a la apertura.',
    ]);
  });

  it('rejects a range shorter than one slot', () => {
    expect(rangeErrors([{ day: 'MONDAY', open: '10:00', close: '11:00' }], 90)).toEqual([
      'El tramo debe durar al menos un turno (90 min).',
    ]);
  });

  it('marks the later of two overlapping ranges of the same day', () => {
    expect(
      rangeErrors(
        [
          { day: 'MONDAY', open: '17:00', close: '22:00' },
          { day: 'MONDAY', open: '08:00', close: '18:00' },
          { day: 'TUESDAY', open: '17:00', close: '22:00' },
        ],
        60,
      ),
    ).toEqual(['Se solapa con el tramo 08:00–18:00 del mismo día.', null, null]);
  });

  it('skips the slot-length check while the slot length is invalid', () => {
    expect(rangeErrors([{ day: 'MONDAY', open: '10:00', close: '10:30' }], null)).toEqual([null]);
  });
});

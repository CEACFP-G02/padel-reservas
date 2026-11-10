import { DayOfWeek, IsoTime } from '../../shared/models';

export const SLOT_MINUTES_MIN = 30;
export const SLOT_MINUTES_MAX = 240;

/** An opening range as edited in the form: fields may still be empty. */
export interface RangeDraft {
  day: DayOfWeek | null;
  open: IsoTime | null;
  close: IsoTime | null;
}

const minutesOf = (time: IsoTime): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * The backend rules for opening ranges (docs/api.md#schedule--apiv1courtsidschedule): each range closes after it
 * opens and fits at least one slot; ranges of the same day do not overlap (they may touch). Returns one Spanish
 * message (or null) per range. `slotMinutes` is null while the slot length itself is invalid.
 */
export function rangeErrors(ranges: RangeDraft[], slotMinutes: number | null): (string | null)[] {
  const errors = ranges.map((range): string | null => {
    if (!range.day || !range.open || !range.close) {
      return 'Indica el día, la apertura y el cierre.';
    }
    const length = minutesOf(range.close) - minutesOf(range.open);
    if (length <= 0) {
      return 'El cierre debe ser posterior a la apertura.';
    }
    if (slotMinutes !== null && length < slotMinutes) {
      return `El tramo debe durar al menos un turno (${slotMinutes} min).`;
    }
    return null;
  });

  // Per day, sorted by opening time: a range overlaps if it opens before the latest close seen so far.
  const sorted = ranges
    .map((range, index) => ({ range, index }))
    .filter(({ index }) => errors[index] === null)
    .sort((a, b) => minutesOf(a.range.open!) - minutesOf(b.range.open!));
  const latestByDay = new Map<DayOfWeek, RangeDraft>();
  for (const { range, index } of sorted) {
    const latest = latestByDay.get(range.day!);
    if (latest && minutesOf(range.open!) < minutesOf(latest.close!)) {
      errors[index] = `Se solapa con el tramo ${latest.open}–${latest.close} del mismo día.`;
    }
    if (!latest || minutesOf(range.close!) > minutesOf(latest.close!)) {
      latestByDay.set(range.day!, range);
    }
  }
  return errors;
}

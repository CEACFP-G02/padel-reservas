import { CourtType } from '../../shared/models';

export const COURT_TYPE_LABELS: Record<CourtType, string> = {
  [CourtType.GLASS]: 'Cristal',
  [CourtType.WALL]: 'Muro',
};

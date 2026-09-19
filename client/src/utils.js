export function formatHour(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) return '--:--';

  const totalMinutes = Math.round(numericValue * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export const RELATION_BOUNDS = { min: -100, max: 100 };

export const RELATION_OUTCOME_LABELS = {
  'on-time': '准时送达',
  late: '逾时送达',
  wrong: '误投'
};

export function isRelationChangeClamped(change) {
  if (!change) return false;
  return Number.isFinite(change.requestedDelta) && change.requestedDelta !== change.delta;
}

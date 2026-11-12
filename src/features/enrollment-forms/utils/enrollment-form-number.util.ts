export function parseEnrollmentFormNumber(raw: string): number | string | null {
  if (!raw.trim()) {
    return null;
  }

  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw)) {
    return raw;
  }

  const value = Number(raw);

  return Number.isFinite(value) && (!Number.isInteger(value) || Number.isSafeInteger(value)) ? value : raw;
}

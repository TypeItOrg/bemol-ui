export const INSTRUMENT_ICON = [
  "MUSIC",
  "PIANO",
  "KEYBOARD",
  "GUITAR",
  "VIOLIN",
  "CELLO",
  "HARP",
  "FLUTE",
  "CLARINET",
  "SAXOPHONE",
  "TRUMPET",
  "BANDONEON",
  "PERCUSSION",
  "VOICE",
] as const;

export type InstrumentIcon = (typeof INSTRUMENT_ICON)[number];

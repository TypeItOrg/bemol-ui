import type { InstrumentIcon } from "@features/academic/types/instrument-icon.types";

export type Instrument = {
  id: string;
  institutionId: string;
  institutionName?: string;
  name: string;
  description: string | null;
  icon: InstrumentIcon;
  active: boolean;
  deletedAt?: string | null;
};

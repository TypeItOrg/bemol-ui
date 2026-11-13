import type { ReactElement } from "react";

import { INSTRUMENT_ICONS } from "@features/academic/constants/instrument-icon.constants";
import type { InstrumentIcon } from "@features/academic/types/instrument-icon.types";

export function InstrumentIconBadge({ icon }: { icon: InstrumentIcon }): ReactElement {
  const { label, icon: Icon } = INSTRUMENT_ICONS[icon];

  return (
    <span title={label} className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
      <Icon className="size-4" aria-hidden="true" />
    </span>
  );
}

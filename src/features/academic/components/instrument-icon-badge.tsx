import type { ReactElement } from "react";

import { DataTableIconBadge } from "@common/components/ui/data-table-icon-badge";

import { INSTRUMENT_ICONS } from "@features/academic/constants/instrument-icon.constants";
import type { InstrumentIcon } from "@features/academic/types/instrument-icon.types";

export function InstrumentIconBadge({ icon }: { icon: InstrumentIcon }): ReactElement {
  const { label, icon: Icon } = INSTRUMENT_ICONS[icon];

  return <DataTableIconBadge icon={Icon} title={label} />;
}

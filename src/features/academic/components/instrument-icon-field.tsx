import type { ReactElement } from "react";

import { cn } from "@common/utils/cn.util";

import { DEFAULT_INSTRUMENT_ICON, INSTRUMENT_ICONS } from "@features/academic/constants/instrument-icon.constants";
import { INSTRUMENT_ICON, type InstrumentIcon } from "@features/academic/types/instrument-icon.types";

type InstrumentIconFieldProps = {
  defaultValue?: unknown;
  error?: string;
};

export function InstrumentIconField({ defaultValue, error }: InstrumentIconFieldProps): ReactElement {
  const initial = INSTRUMENT_ICON.includes(defaultValue as InstrumentIcon) ? (defaultValue as InstrumentIcon) : DEFAULT_INSTRUMENT_ICON;

  return (
    <fieldset className="@container flex w-full flex-col gap-2" aria-invalid={Boolean(error)} aria-describedby={error ? "icon-error" : undefined}>
      <legend className="mb-2 text-sm font-medium">Ícono</legend>
      <div className="grid grid-cols-2 gap-2 @xl:grid-cols-7">
        {INSTRUMENT_ICON.map((value) => {
          const { label, icon: Icon } = INSTRUMENT_ICONS[value];

          return (
            <label
              key={value}
              className={cn(
                "bg-background hover:bg-muted/50 flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs transition-colors",
                "has-checked:border-primary has-checked:bg-primary/5 has-checked:text-primary has-focus-visible:ring-ring/50 has-focus-visible:ring-3",
              )}
            >
              <input type="radio" name="icon" value={value} defaultChecked={value === initial} className="sr-only" />
              <Icon className="size-6" aria-hidden="true" />
              {label}
            </label>
          );
        })}
      </div>
      {error ? (
        <p id="icon-error" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

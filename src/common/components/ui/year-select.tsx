"use client";

import { useRef, type ComponentProps, type ReactElement } from "react";

import { XIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@common/components/ui/select";
import { cn } from "@common/utils/cn.util";

type YearSelectProps = Omit<ComponentProps<typeof Select>, "children"> & {
  allOptionLabel?: string;
  ariaInvalid?: boolean;
  ariaLabelledBy?: string;
  className?: string;
  id?: string;
  maxYear: number;
  minYear: number;
  placeholder?: string;
};

export function YearSelect({
  allOptionLabel,
  ariaInvalid,
  ariaLabelledBy,
  className,
  disabled,
  id,
  maxYear,
  minYear,
  placeholder = "Seleccionar año",
  value,
  onValueChange,
  ...props
}: YearSelectProps): ReactElement {
  const years = getDescendingYears(minYear, maxYear);

  const triggerRef = useRef<HTMLButtonElement>(null);

  const canClear = Boolean(allOptionLabel && value && value !== "all");

  const selectedLabel = getSelectedLabel(value, allOptionLabel);

  return (
    <div className="relative w-full">
      <Select {...props} disabled={disabled} onValueChange={onValueChange} value={value ?? ""}>
        <SelectTrigger ref={triggerRef} id={id} aria-invalid={ariaInvalid} aria-labelledby={ariaLabelledBy} className={cn("w-full", className)}>
          <SelectValue placeholder={placeholder} className={cn("min-w-0 truncate", canClear && "mr-8")}>
            {selectedLabel}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {allOptionLabel ? (
              <SelectItem value="all" className="px-2.5 py-1.5">
                {allOptionLabel}
              </SelectItem>
            ) : null}
            {years.map((year) => (
              <SelectItem key={year} value={String(year)} className="px-2.5 py-1.5">
                {year}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {canClear ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-9 size-6 -translate-y-1/2"
          aria-label="Limpiar año"
          disabled={disabled}
          onClick={() => {
            onValueChange?.("all");
            triggerRef.current?.focus();
          }}
        >
          <XIcon aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}

function getSelectedLabel(value: string | undefined, allOptionLabel: string | undefined): string | undefined {
  if (value === "all") {
    return allOptionLabel;
  }

  return value;
}

function getDescendingYears(minYear: number, maxYear: number): number[] {
  if (minYear > maxYear) {
    return [];
  }

  return Array.from({ length: maxYear - minYear + 1 }, (_, index) => maxYear - index);
}

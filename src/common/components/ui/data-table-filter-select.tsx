"use client";

import { useId, useRef, type ReactElement } from "react";

import { XIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@common/components/ui/select";
import { type DataTableSelectFilter } from "@common/types/data-table-select-filter.types";
import { cn } from "@common/utils/cn.util";

export function DataTableFilterSelect<TValue extends string = string>({ filter, onValueChange }: DataTableFilterSelectProps<TValue>): ReactElement {
  const labelId = useId();

  const triggerRef = useRef<HTMLButtonElement>(null);

  const canClear = filter.value !== filter.defaultValue;

  const selectedLabel = filter.options.find((option) => option.value === filter.value)?.label;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span id={labelId} className="text-foreground text-sm font-medium">
        {filter.label}
      </span>
      <div className="relative min-w-0">
        <Select value={filter.value} onValueChange={(value) => onValueChange(value as TValue)}>
          <SelectTrigger ref={triggerRef} className="h-9! w-full min-w-36" aria-labelledby={labelId}>
            <SelectValue className={cn("min-w-0 truncate", canClear && "mr-8")}>{selectedLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value} className="px-2.5 py-1.5">
                  {option.label}
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
            aria-label={`Limpiar ${filter.label.toLowerCase()}`}
            onClick={() => {
              onValueChange(filter.defaultValue);
              triggerRef.current?.focus();
            }}
          >
            <XIcon aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export type DataTableFilterSelectProps<TValue extends string> = {
  filter: DataTableSelectFilter<TValue>;
  onValueChange: (value: TValue) => void;
};

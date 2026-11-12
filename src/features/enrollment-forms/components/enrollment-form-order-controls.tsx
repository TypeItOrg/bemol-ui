import type { ReactElement } from "react";

import { ArrowDownIcon, ArrowUpIcon, Trash2Icon } from "lucide-react";

import { Button } from "@common/components/ui/button";

export function EnrollmentFormOrderControls({
  index,
  total,
  label,
  disabled,
  onMove,
  onRemove,
}: {
  index: number;
  total: number;
  label: string;
  disabled?: boolean;
  onMove: (delta: number) => void;
  onRemove?: () => void;
}): ReactElement {
  return (
    <div className="flex shrink-0 gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        aria-label={`Subir ${label}`}
        disabled={disabled || index === 0}
        onClick={() => onMove(-1)}
      >
        <ArrowUpIcon aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        aria-label={`Bajar ${label}`}
        disabled={disabled || index === total - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDownIcon aria-hidden="true" />
      </Button>
      {onRemove ? (
        <Button type="button" variant="destructive" size="icon-lg" aria-label={`Quitar ${label}`} disabled={disabled} onClick={onRemove}>
          <Trash2Icon aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}

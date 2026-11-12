"use client";

import type { ReactElement, ReactNode } from "react";

import { EyeIcon, EyeOffIcon, LockIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@common/components/ui/tooltip";
import { cn } from "@common/utils/cn.util";

export const pdfHoverRevealClassName =
  "transition-opacity [@media(hover:hover)]:opacity-0 group-has-[:focus-visible]/row:opacity-100 group-hover/row:opacity-100";

export function PdfVisibilityToggle({
  compact = false,
  label,
  visible,
  disabled,
  onToggle,
}: {
  compact?: boolean;
  label: string;
  visible: boolean;
  disabled: boolean;
  onToggle: () => void;
}): ReactElement {
  const Icon = visible ? EyeIcon : EyeOffIcon;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      aria-label={`Imprimir ${label}`}
      aria-pressed={visible}
      disabled={disabled}
      className={cn(compact && "-my-0.5", !visible && "text-muted-foreground")}
      onClick={onToggle}
    >
      <Icon aria-hidden="true" />
    </Button>
  );
}

export function PdfLockedIndicator({ label }: { label: string }): ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          aria-label={`${label} siempre se imprime`}
          className="text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md"
        >
          <LockIcon className="size-4" aria-hidden="true" />
        </span>
      </TooltipTrigger>
      <TooltipContent>Siempre se imprime</TooltipContent>
    </Tooltip>
  );
}

export function PdfRow({
  children,
  compact = false,
  controls,
  visible,
}: {
  children: ReactNode;
  compact?: boolean;
  controls: ReactNode;
  visible: boolean;
}): ReactElement {
  return (
    <div className={cn("group/row flex items-center justify-between gap-3", compact ? "min-h-8" : "min-h-12 py-1.5")}>
      <div className={cn("flex min-w-0 flex-1 items-center gap-2", !visible && "opacity-50")}>{children}</div>
      <div className="flex shrink-0 items-center gap-1">{controls}</div>
    </div>
  );
}

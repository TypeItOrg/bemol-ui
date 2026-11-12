"use client";

import type { ReactElement, ReactNode, Ref } from "react";

import { EllipsisVerticalIcon, Trash2Icon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@common/components/ui/dropdown-menu";
import { cn } from "@common/utils/cn.util";

import { EnrollmentFormOrderControls } from "@features/enrollment-forms/components/enrollment-form-order-controls";

export function EnrollmentFormItemMenu({
  label,
  index,
  total,
  disabled,
  onMove,
  onRemove,
  children,
  triggerRef,
  onCloseAutoFocus,
  inlineOrder = false,
  align = "start",
  removeInline = false,
  variant = "ghost",
}: {
  label: string;
  index: number;
  total: number;
  disabled: boolean;
  onMove: (delta: number) => void;
  onRemove?: () => void;
  children?: ReactNode;
  triggerRef?: Ref<HTMLButtonElement>;
  onCloseAutoFocus?: (event: Event) => void;
  inlineOrder?: boolean | "responsive";
  align?: "start" | "end";
  removeInline?: boolean;
  variant?: "ghost" | "outline";
}): ReactElement {
  const responsiveOrder = inlineOrder === "responsive";

  const inlineRemoval = responsiveOrder && !children && Boolean(onRemove);

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          variant={variant}
          size="icon-lg"
          className={cn("shrink-0", inlineRemoval && "lg:hidden")}
          disabled={disabled}
          aria-label={`Abrir acciones de ${label}`}
        >
          <EllipsisVerticalIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={cn("w-64 p-1.5", inlineRemoval && "lg:hidden")} onCloseAutoFocus={onCloseAutoFocus}>
        {children}
        {inlineOrder !== true ? (
          <DropdownMenuGroup className={responsiveOrder ? "lg:hidden" : undefined}>
            {children ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem className="px-2.5 py-1.5" disabled={index === 0} onSelect={() => onMove(-1)}>
              Subir
            </DropdownMenuItem>
            <DropdownMenuItem className="px-2.5 py-1.5" disabled={index === total - 1} onSelect={() => onMove(1)}>
              Bajar
            </DropdownMenuItem>
          </DropdownMenuGroup>
        ) : null}
        {onRemove ? (
          <>
            {children || inlineOrder !== true ? (
              <DropdownMenuSeparator className={(!children && responsiveOrder) || removeInline ? "lg:hidden" : undefined} />
            ) : null}
            <DropdownMenuItem variant="destructive" className={cn("px-2.5 py-1.5", removeInline && "lg:hidden")} onSelect={onRemove}>
              Quitar
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return inlineOrder ? (
    <div className="flex shrink-0 items-center gap-1">
      <div className={responsiveOrder ? "hidden lg:block" : undefined}>
        <EnrollmentFormOrderControls
          index={index}
          total={total}
          label={label}
          disabled={disabled}
          onMove={onMove}
          onRemove={inlineRemoval ? onRemove : undefined}
        />
      </div>
      {removeInline && onRemove ? (
        <Button
          type="button"
          variant="destructive"
          size="icon-lg"
          className="hidden shrink-0 lg:inline-flex"
          aria-label={`Quitar ${label}`}
          disabled={disabled}
          onClick={onRemove}
        >
          <Trash2Icon aria-hidden="true" />
        </Button>
      ) : null}
      {menu}
    </div>
  ) : (
    menu
  );
}

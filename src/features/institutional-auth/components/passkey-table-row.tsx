"use client";

import type { ReactElement } from "react";

import { EllipsisVerticalIcon, KeyRoundIcon } from "lucide-react";

import { Badge } from "@common/components/ui/badge";
import { Button } from "@common/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@common/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@common/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@common/components/ui/table";

import type { Passkey } from "@features/institutional-auth/types/passkey.types";

type PasskeyTableRowProps = {
  passkey: Passkey;
  revokeDisabled: boolean;
  onRename: () => void;
  onRevoke: () => void;
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

const relativeFormatter = new Intl.RelativeTimeFormat("es-AR", { numeric: "auto" });

export function PasskeyTableRow({ passkey, revokeDisabled, onRename, onRevoke }: PasskeyTableRowProps): ReactElement {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TableRow>
          <TableCell className="w-16 pl-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Abrir acciones de ${passkey.label}`}>
                  <EllipsisVerticalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40 p-1.5">
                <DropdownMenuGroup>
                  <DropdownMenuItem className="px-2.5 py-1.5" onSelect={onRename}>
                    Renombrar
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" className="px-2.5 py-1.5" disabled={revokeDisabled} onSelect={onRevoke}>
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
          <TableCell>
            <span className="flex min-w-0 items-center gap-3">
              <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                <KeyRoundIcon aria-hidden="true" className="size-4" />
              </span>
              <span className="truncate font-medium">{passkey.label}</span>
            </span>
          </TableCell>
          <TableCell className="text-muted-foreground tabular-nums">{formatDate(passkey.createdAt)}</TableCell>
          <TableCell>
            {passkey.lastUsedAt ? (
              <span className="text-muted-foreground">{formatRelative(passkey.lastUsedAt)}</span>
            ) : (
              <Badge variant="secondary">Sin usar</Badge>
            )}
          </TableCell>
        </TableRow>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-40 p-1.5">
        <ContextMenuGroup>
          <ContextMenuItem className="px-2.5 py-1.5" onSelect={onRename}>
            Renombrar
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" className="px-2.5 py-1.5" disabled={revokeDisabled} onSelect={onRevoke}>
          Eliminar
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function toDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: string | null): string {
  const date = toDate(value);

  return date ? dateFormatter.format(date) : "—";
}

// Coarse relative label: today, yesterday, days, months or years ago.
function formatRelative(value: string): string {
  const date = toDate(value);

  if (!date) {
    return "—";
  }

  const days = Math.round((date.getTime() - Date.now()) / 86_400_000);

  if (Math.abs(days) < 30) {
    return capitalize(relativeFormatter.format(days, "day"));
  }

  if (Math.abs(days) < 365) {
    return capitalize(relativeFormatter.format(Math.round(days / 30), "month"));
  }

  return capitalize(relativeFormatter.format(Math.round(days / 365), "year"));
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

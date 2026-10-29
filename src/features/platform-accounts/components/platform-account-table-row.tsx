"use client";

import { useState, type ReactElement } from "react";

import { ReturnToLink } from "@common/components/navigation/return-to-link";
import { Badge } from "@common/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@common/components/ui/context-menu";
import { TableCell, TableRow } from "@common/components/ui/table";

import { PlatformAccountDisableDialog } from "@features/platform-accounts/components/platform-account-disable-dialog";
import { PlatformAccountActions, dateFormatter } from "@features/platform-accounts/components/platform-account-table-actions";
import type { PlatformAccountAdmin } from "@features/platform-accounts/types/platform-account-admin.types";
import { usePlatformAccount } from "@features/platform-auth/hooks/use-platform-account.hook";

export function PlatformAccountTableRow({ account }: { account: PlatformAccountAdmin }): ReactElement {
  const [disableOpen, setDisableOpen] = useState(false);

  const { account: currentAccount } = usePlatformAccount();

  const disableDisabled = !currentAccount || currentAccount.platformAccountId === account.platformAccountId;

  return (
    <>
      <ContextMenu key={account.platformAccountId}>
        <ContextMenuTrigger asChild>
          <TableRow>
            <TableCell className="w-16 pl-4">
              <PlatformAccountActions account={account} disableDisabled={disableDisabled} onDisable={() => setDisableOpen(true)} />
            </TableCell>
            <TableCell className="font-medium">
              <ReturnToLink className="hover:underline" href={`/admin/accounts/${account.platformAccountId}`}>
                {account.name} {account.lastName}
              </ReturnToLink>
            </TableCell>
            <TableCell className="text-muted-foreground">{account.email}</TableCell>
            <TableCell>
              <Badge size="lg" variant="secondary">
                {account.roleName}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={account.enabled ? "success" : "destructive"}>{account.enabled ? "Habilitado" : "Deshabilitado"}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground tabular-nums">{dateFormatter.format(new Date(account.createdAt))}</TableCell>
          </TableRow>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-40 p-1.5">
          <ContextMenuGroup>
            <ContextMenuItem asChild>
              <ReturnToLink href={`/admin/accounts/${account.platformAccountId}`} className="px-2.5 py-1.5">
                Ver detalle
              </ReturnToLink>
            </ContextMenuItem>
            <ContextMenuItem asChild>
              <ReturnToLink href={`/admin/accounts/${account.platformAccountId}/edit`} className="px-2.5 py-1.5">
                Editar
              </ReturnToLink>
            </ContextMenuItem>
          </ContextMenuGroup>
          {account.enabled ? (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem variant="destructive" className="px-2.5 py-1.5" disabled={disableDisabled} onSelect={() => setDisableOpen(true)}>
                Deshabilitar
              </ContextMenuItem>
            </>
          ) : null}
        </ContextMenuContent>
      </ContextMenu>
      {disableOpen ? <PlatformAccountDisableDialog account={account} onClose={() => setDisableOpen(false)} /> : null}
    </>
  );
}

"use client";

import type { ReactElement } from "react";

import Link from "next/link";

import { BuildingIcon, KeyRoundIcon, UserLockIcon, UsersIcon } from "lucide-react";

import { ReturnToLink } from "@common/components/navigation/return-to-link";
import { Badge } from "@common/components/ui/badge";
import { ContextMenu, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuTrigger } from "@common/components/ui/context-menu";
import { DataTableIconLabel } from "@common/components/ui/data-table-icon-badge";
import { TableCell, TableRow } from "@common/components/ui/table";

import { PlatformRoleActions } from "@features/roles/components/platform-role-table-actions";
import type { PlatformRoleListItem } from "@features/roles/types/platform-role-list-item.types";

export function PlatformRoleTableRow({ role }: { role: PlatformRoleListItem }): ReactElement {
  return (
    <ContextMenu key={role.id}>
      <ContextMenuTrigger asChild>
        <TableRow>
          <TableCell className="w-16 pl-4">
            <PlatformRoleActions role={role} />
          </TableCell>
          <TableCell className="font-medium">
            <DataTableIconLabel icon={UserLockIcon}>
              <Link href={`/roles/${role.id}`} className="hover:underline">
                {role.name}
              </Link>
            </DataTableIconLabel>
          </TableCell>
          <TableCell>
            <DataTableIconLabel icon={BuildingIcon}>
              <span>
                <Link href={`/institutions/${role.institution.id}`} className="text-muted-foreground font-medium hover:underline">
                  {role.institution.name}
                </Link>
                {!role.institution.active ? (
                  <Badge variant="outline" className="ml-2">
                    Inactiva
                  </Badge>
                ) : null}
              </span>
            </DataTableIconLabel>
          </TableCell>
          <TableCell>
            <Badge variant={role.technicalCode ? "secondary" : "outline"}>{role.technicalCode ? "Sistema" : "Personalizado"}</Badge>
          </TableCell>
          <TableCell>
            <DataTableIconLabel icon={UsersIcon}>{role.assignmentCount}</DataTableIconLabel>
          </TableCell>
          <TableCell>
            <DataTableIconLabel icon={KeyRoundIcon}>{role.permissionCount}</DataTableIconLabel>
          </TableCell>
        </TableRow>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48 p-1.5">
        <ContextMenuGroup>
          <ContextMenuItem asChild>
            <Link href={`/roles/${role.id}`} className="px-2.5 py-1.5">
              Ver detalle
            </Link>
          </ContextMenuItem>
          {role.editable ? (
            <ContextMenuItem asChild>
              <ReturnToLink href={`/roles/${role.id}/edit`} className="px-2.5 py-1.5">
                Editar rol
              </ReturnToLink>
            </ContextMenuItem>
          ) : (
            <ContextMenuItem disabled className="px-2.5 py-1.5">
              Editar rol
            </ContextMenuItem>
          )}
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

"use client";

import { useRef, useState, type ReactElement, type RefObject } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { EllipsisVerticalIcon } from "lucide-react";

import { ReturnToLink } from "@common/components/navigation/return-to-link";
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

import { PersonDeleteDialog } from "@features/people/components/person-delete-dialog";
import type { PlatformPersonSummary } from "@features/people/types/platform-person-summary.types";

export function PlatformPeopleTableRow({ canUpdate, person }: { canUpdate: boolean; person: PlatformPersonSummary }): ReactElement {
  const router = useRouter();

  const [deleteOpen, setDeleteOpen] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <TableRow className="h-11">
            <TableCell className="w-16 pl-4">
              <PlatformPersonActions person={person} canUpdate={canUpdate} triggerRef={triggerRef} onDelete={() => setDeleteOpen(true)} />
            </TableCell>
            <TableCell className="font-medium">
              {canUpdate ? (
                <ReturnToLink className="hover:underline" href={getPersonPath(person)}>
                  {person.lastName}, {person.firstName}
                </ReturnToLink>
              ) : (
                <span>
                  {person.lastName}, {person.firstName}
                </span>
              )}
            </TableCell>
            <TableCell>{person.documentNumber}</TableCell>
            <TableCell>
              <Link className="text-muted-foreground font-medium hover:underline" href={getInstitutionPath(person)}>
                {person.institutionName}
              </Link>
            </TableCell>
            <TableCell>{person.phoneNumber || <span className="text-muted-foreground/60">Sin teléfono</span>}</TableCell>
            <TableCell>{person.email || <span className="text-muted-foreground/60">Sin email</span>}</TableCell>
            <TableCell>
              {person.roles.length ? (
                <div className="flex flex-wrap gap-1">
                  {person.roles.map((role) => (
                    <Badge key={role.roleCode} variant="secondary">
                      {role.displayName}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground/60">Sin rol</span>
              )}
            </TableCell>
          </TableRow>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-44 p-1.5">
          <ContextMenuGroup>
            {canUpdate ? (
              <ContextMenuItem asChild>
                <ReturnToLink href={getPersonPath(person)} className="px-2.5 py-1.5">
                  Editar
                </ReturnToLink>
              </ContextMenuItem>
            ) : null}
            <ContextMenuItem asChild>
              <Link href={getInstitutionPath(person)} className="px-2.5 py-1.5">
                Ver institución
              </Link>
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive" className="px-2.5 py-1.5" onSelect={() => setDeleteOpen(true)}>
            Eliminar
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {deleteOpen ? (
        <PersonDeleteDialog
          institutionId={person.institutionId}
          personId={person.id}
          personName={`${person.firstName} ${person.lastName}`}
          open
          onOpenChange={setDeleteOpen}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            triggerRef.current?.focus();
          }}
          onDeleted={() => {
            setDeleteOpen(false);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}

function PlatformPersonActions({
  person,
  canUpdate,
  onDelete,
  triggerRef,
}: {
  person: PlatformPersonSummary;
  canUpdate: boolean;
  onDelete: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}): ReactElement {
  return (
    <div className="flex justify-start">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button ref={triggerRef} variant="ghost" size="icon" aria-label={`Abrir acciones de ${person.firstName} ${person.lastName}`}>
            <EllipsisVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44 p-1.5">
          <DropdownMenuGroup>
            {canUpdate ? (
              <DropdownMenuItem asChild>
                <ReturnToLink href={getPersonPath(person)} className="px-2.5 py-1.5">
                  Editar
                </ReturnToLink>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem asChild>
              <Link href={getInstitutionPath(person)} className="px-2.5 py-1.5">
                Ver institución
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" className="px-2.5 py-1.5" onSelect={onDelete}>
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function getPersonPath(person: PlatformPersonSummary): string {
  return `/admin/institutions/${person.institutionId}/people/${person.id}`;
}

function getInstitutionPath(person: PlatformPersonSummary): string {
  return `/admin/institutions/${person.institutionId}`;
}

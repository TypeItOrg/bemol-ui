import type { ReactElement } from "react";

import { CircleQuestionMarkIcon, EllipsisVerticalIcon } from "lucide-react";

import { OptionalValue } from "@common/components/optional-value";
import { Badge } from "@common/components/ui/badge";
import { Button } from "@common/components/ui/button";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@common/components/ui/context-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@common/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@common/components/ui/popover";
import { TableCell, TableRow } from "@common/components/ui/table";

import { calculateAge } from "@features/enrollment-applications/schemas/enrollment-application.schema";
import { GUARDIAN_LINK_STATUS_LABELS, GUARDIAN_RELATIONSHIP_LABELS } from "@features/guardian-dependents/constants/guardian-dependent.constants";
import type { GuardianDependent } from "@features/guardian-dependents/types/guardian-dependent.types";
import { GUARDIAN_LINK_STATUS, type GuardianLinkStatus } from "@features/guardian-dependents/types/guardian-link-status.types";
import { getGuardianDependentName } from "@features/guardian-dependents/utils/guardian-dependent-display.util";

const STATUS_BADGE_VARIANT: Record<GuardianLinkStatus, "success" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "success",
  PENDING: "secondary",
  REJECTED: "destructive",
  ENDED: "outline",
};

const STATUS_DETAILS: Record<GuardianLinkStatus, string> = {
  ACTIVE: "La institución aprobó la vinculación. Podés activar esta identidad con todos sus roles y permisos.",
  PENDING: "La institución todavía tiene que validar la vinculación. Hasta entonces no podés gestionar a esta persona.",
  REJECTED: "La institución rechazó la vinculación. Contactá a la institución si necesitás revisar la solicitud.",
  ENDED: "La vinculación finalizó. Ya no podés gestionar a esta persona.",
};

const OWN_ACCESS_STATUS_LABELS: Record<GuardianDependent["ownAccessStatus"], string> = {
  NO_ACCOUNT: "Sin cuenta",
  INVITATION_PENDING: "Invitación pendiente",
  ENABLED: "Habilitado",
  DISABLED: "Deshabilitado",
  INSTITUTION_BLOCKED: "Bloqueado por la institución",
  INSTITUTION_REQUIRED: "Alta a cargo de la institución",
  UNAVAILABLE: "No disponible",
};

const OWN_ACCESS_BADGE_VARIANT: Record<GuardianDependent["ownAccessStatus"], "success" | "secondary" | "destructive" | "outline"> = {
  NO_ACCOUNT: "secondary",
  INVITATION_PENDING: "secondary",
  ENABLED: "success",
  DISABLED: "outline",
  INSTITUTION_BLOCKED: "destructive",
  INSTITUTION_REQUIRED: "secondary",
  UNAVAILABLE: "outline",
};

export function GuardianDependentRow({
  dependent,
  isSelectingWorkspace,
  onEnroll,
  onUnlink,
  onManageAccess,
}: {
  dependent: GuardianDependent;
  isSelectingWorkspace: boolean;
  onEnroll: () => void;
  onUnlink: () => void;
  onManageAccess?: () => void;
}): ReactElement {
  const name = getGuardianDependentName(dependent) || "esta persona";

  const age = calculateAge(dependent.birthDate ?? undefined);

  const isActive = dependent.status === GUARDIAN_LINK_STATUS.ACTIVE;

  const canUnlink = isActive || dependent.status === GUARDIAN_LINK_STATUS.PENDING;

  const canInviteOwnAccess = isActive && !["INSTITUTION_REQUIRED", "INSTITUTION_BLOCKED", "UNAVAILABLE"].includes(dependent.ownAccessStatus);

  const tableRow = (
    <TableRow className="h-12">
      <TableCell className="w-16 pl-4">
        {canUnlink ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label={`Abrir acciones de ${name}`} size="icon" type="button" variant="ghost">
                <EllipsisVerticalIcon aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-max max-w-[calc(100vw-2rem)] min-w-48 p-1.5">
              {isActive ? (
                <>
                  <DropdownMenuItem className="px-2.5 py-1.5" disabled={isSelectingWorkspace} onSelect={onEnroll}>
                    Inscribir
                  </DropdownMenuItem>
                  {canInviteOwnAccess ? (
                    <DropdownMenuItem className="px-2.5 py-1.5" onSelect={onManageAccess}>
                      Gestionar acceso propio
                    </DropdownMenuItem>
                  ) : null}
                </>
              ) : null}
              <DropdownMenuItem className="px-2.5 py-1.5" onSelect={onUnlink} variant="destructive">
                {isActive ? "Quitar vinculación" : "Cancelar solicitud"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="sr-only">Sin acciones disponibles</span>
        )}
      </TableCell>
      <TableCell className="font-medium">
        <OptionalValue value={dependent.firstName} fallback={isActive ? "Nombre no informado" : "Disponible al aprobar"} />
      </TableCell>
      <TableCell className="font-medium">
        <OptionalValue value={dependent.lastName} fallback={isActive ? "Apellido no informado" : "Disponible al aprobar"} />
      </TableCell>
      <TableCell className="tabular-nums">{dependent.documentNumber}</TableCell>
      <TableCell className="tabular-nums">
        <OptionalValue
          value={age === null ? null : `${age} ${age === 1 ? "año" : "años"}`}
          fallback={isActive ? "Edad no informada" : "Disponible al aprobar"}
        />
      </TableCell>
      <TableCell>{GUARDIAN_RELATIONSHIP_LABELS[dependent.relationship]}</TableCell>
      <TableCell>{dependent.isPrimaryContact ? "Sí" : "No"}</TableCell>
      <TableCell>
        <Popover>
          <PopoverTrigger asChild>
            <Badge asChild size="lg" className="[&>svg]:size-3.5!" variant={STATUS_BADGE_VARIANT[dependent.status]}>
              <button
                aria-label={`Ver detalle del estado: ${GUARDIAN_LINK_STATUS_LABELS[dependent.status]} de ${name}`}
                className="cursor-pointer gap-1.5"
                type="button"
              >
                {GUARDIAN_LINK_STATUS_LABELS[dependent.status]}
                <CircleQuestionMarkIcon aria-hidden="true" className="size-3.5" />
              </button>
            </Badge>
          </PopoverTrigger>
          <PopoverContent align="start" className="max-w-[calc(100vw-2rem)] p-3">
            <PopoverHeader>
              <PopoverTitle>{GUARDIAN_LINK_STATUS_LABELS[dependent.status]}</PopoverTitle>
              <PopoverDescription>{STATUS_DETAILS[dependent.status]}</PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </TableCell>
      <TableCell>
        {isActive ? (
          <Badge size="lg" className="data-[variant=outline]:text-muted-foreground" variant={OWN_ACCESS_BADGE_VARIANT[dependent.ownAccessStatus]}>
            {OWN_ACCESS_STATUS_LABELS[dependent.ownAccessStatus]}
          </Badge>
        ) : (
          <OptionalValue value={null} fallback="Disponible al aprobar" />
        )}
      </TableCell>
      <TableCell className="tabular-nums">
        <OptionalValue
          value={
            isActive && dependent.activeApplicationsCount > 0
              ? `${dependent.activeApplicationsCount} ${dependent.activeApplicationsCount === 1 ? "inscripción activa" : "inscripciones activas"}`
              : null
          }
          fallback={isActive ? "Sin inscripciones" : "Disponible al aprobar"}
        />
      </TableCell>
    </TableRow>
  );

  if (!canUnlink) {
    return tableRow;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{tableRow}</ContextMenuTrigger>
      <ContextMenuContent className="w-max max-w-[calc(100vw-2rem)] min-w-48 p-1.5">
        {isActive ? (
          <>
            <ContextMenuItem className="px-2.5 py-1.5" disabled={isSelectingWorkspace} onSelect={onEnroll}>
              Inscribir
            </ContextMenuItem>
            {canInviteOwnAccess ? (
              <ContextMenuItem className="px-2.5 py-1.5" onSelect={onManageAccess}>
                Gestionar acceso propio
              </ContextMenuItem>
            ) : null}
          </>
        ) : null}
        <ContextMenuItem className="px-2.5 py-1.5" onSelect={onUnlink} variant="destructive">
          {isActive ? "Quitar vinculación" : "Cancelar solicitud"}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

"use client";

import { useId, useState, type ReactElement } from "react";

import { CircleHelpIcon, KeyRoundIcon, Loader2Icon, SearchIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import { useDataTableNavigation } from "@common/components/ui/data-table-navigation";
import { DataTableSortableHead } from "@common/components/ui/data-table-sortable-head";
import { EmptyMedia } from "@common/components/ui/empty";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@common/components/ui/popover";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@common/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@common/components/ui/tooltip";
import { DATA_TABLE_EMPTY_MESSAGES } from "@common/constants/data-table-empty.constants";

import { PasskeyTableRow } from "@features/institutional-auth/components/passkey-table-row";
import { PasskeysTableFilters } from "@features/institutional-auth/components/passkeys-table-filters";
import type { Passkey } from "@features/institutional-auth/types/passkey.types";
import type { PasskeySort, PasskeySortField } from "@features/institutional-auth/utils/passkey-query.util";

type PasskeysTablePresentationProps = {
  activeCount: number;
  maxActivePasskeys: number;
  passkeys: Passkey[];
  platform: boolean;
  search: string;
  sort: PasskeySort;
  used: boolean | undefined;
  webauthnSupported: boolean | null;
  onRename: (passkey: Passkey) => void;
  onRevoke: (passkey: Passkey) => void;
};

export function PasskeysTablePresentation({
  activeCount,
  maxActivePasskeys,
  passkeys,
  platform,
  search,
  sort,
  used,
  webauthnSupported,
  onRename,
  onRevoke,
}: PasskeysTablePresentationProps): ReactElement {
  const { isPending, navigate } = useDataTableNavigation();

  const hasFilters = search.trim() !== "" || used !== undefined;

  function updateSort(nextSort: PasskeySort): void {
    navigate({ sortField: nextSort.field, sortDirection: nextSort.direction });
  }

  return (
    <>
      <PasskeysTableFilters search={search} used={used} />

      {webauthnSupported === false ? (
        <p className="text-muted-foreground text-sm">
          Tu navegador no puede crear llaves de acceso. Podés ver, renombrar o eliminar las que ya tenés desde otro dispositivo.
        </p>
      ) : null}

      {passkeys.length === 0 ? (
        <div className="relative" aria-busy={isPending}>
          {hasFilters ? (
            <div className="bg-muted/25 text-muted-foreground flex flex-col items-center justify-center rounded-lg border px-4 py-12 text-center">
              <EmptyMedia className="mb-4" variant="icon">
                <SearchIcon className="size-5" aria-hidden="true" />
              </EmptyMedia>
              <h3 className="text-foreground text-base font-semibold">No se encontraron llaves de acceso</h3>
              <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">{DATA_TABLE_EMPTY_MESSAGES.FILTERED_DESCRIPTION}</p>
            </div>
          ) : (
            <div className="bg-muted/25 text-muted-foreground flex flex-col items-center justify-center rounded-lg border px-4 py-12 text-center">
              <EmptyMedia className="mb-4" variant="icon">
                <KeyRoundIcon className="size-5" aria-hidden="true" />
              </EmptyMedia>
              <h3 className="text-foreground text-base font-semibold">Todavía no tenés llaves de acceso</h3>
              <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">
                {platform
                  ? "Registrá una llave para completar el segundo paso de ingreso."
                  : "Registrá una llave de acceso para iniciar sesión sin contraseña usando tu dispositivo."}
              </p>
            </div>
          )}
          {isPending ? <LoadingOverlay /> : null}
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-lg border" aria-busy={isPending}>
          <Table stickyActions className="min-w-160">
            <TableHeader className="bg-muted sticky top-0 z-10 [&_tr]:border-b">
              <TableRow>
                <TableHead className="w-16 pl-4">
                  <span className="sr-only">Acciones</span>
                </TableHead>
                <DataTableSortableHead<PasskeySortField> field="label" label="Nombre" sort={sort} onSortChange={updateSort} />
                <DataTableSortableHead<PasskeySortField>
                  field="createdAt"
                  label="Fecha de alta"
                  sort={sort}
                  defaultDirection="desc"
                  onSortChange={updateSort}
                />
                <DataTableSortableHead<PasskeySortField>
                  field="lastUsedAt"
                  label="Último uso"
                  sort={sort}
                  defaultDirection="desc"
                  onSortChange={updateSort}
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {passkeys.map((passkey) => (
                <PasskeyTableRow
                  key={passkey.id}
                  passkey={passkey}
                  revokeDisabled={platform && activeCount <= 1}
                  onRename={() => onRename(passkey)}
                  onRevoke={() => onRevoke(passkey)}
                />
              ))}
            </TableBody>
          </Table>
          {isPending ? <LoadingOverlay /> : null}
        </div>
      )}

      {activeCount > 0 || platform ? (
        <div className="@container/passkeys-footer px-1">
          <div className="flex items-center justify-between gap-4">
            {activeCount > 0 ? (
              <p className="text-muted-foreground shrink-0 text-sm tabular-nums">{`${activeCount} de ${maxActivePasskeys} llaves de acceso en uso.`}</p>
            ) : null}
            {platform ? (
              <>
                <p className="text-muted-foreground ml-auto hidden text-right text-sm @4xl/passkeys-footer:block">
                  La administración requiere al menos una llave. Al eliminar otra, se cerrarán tus sesiones.
                </p>
                <div className="ml-auto @4xl/passkeys-footer:hidden">
                  <PlatformPasskeyPolicyPopover />
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function PlatformPasskeyPolicyPopover(): ReactElement {
  const [open, setOpen] = useState(false);

  const [tooltipOpen, setTooltipOpen] = useState(false);

  const titleId = useId();

  function changeOpen(value: boolean): void {
    setOpen(value);

    if (value) {
      setTooltipOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <Tooltip open={!open && tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground size-6"
              aria-label="Ver información sobre llaves de acceso"
            >
              <CircleHelpIcon className="size-4" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        {!open ? <TooltipContent side="top">Más información</TooltipContent> : null}
      </Tooltip>
      <PopoverContent align="end" aria-labelledby={titleId} className="w-80 max-w-[calc(100vw-2rem)] gap-2 p-4" collisionPadding={16}>
        <PopoverHeader>
          <PopoverTitle id={titleId}>Requisitos de seguridad</PopoverTitle>
          <PopoverDescription>La administración requiere al menos una llave. Al eliminar otra, se cerrarán tus sesiones.</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  );
}

function LoadingOverlay(): ReactElement {
  return (
    <div className="bg-background/55 absolute inset-0 z-20 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
      <Loader2Icon className="text-muted-foreground size-5 animate-spin" aria-label="Cargando llaves de acceso" role="status" />
    </div>
  );
}

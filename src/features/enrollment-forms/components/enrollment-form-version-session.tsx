"use client";

import { useState, type ReactElement } from "react";

import { ArchiveIcon, EllipsisVerticalIcon, SendIcon } from "lucide-react";

import { Badge } from "@common/components/ui/badge";
import { Button } from "@common/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@common/components/ui/dropdown-menu";

import { EnrollmentFormAssignmentDialog } from "@features/enrollment-forms/components/enrollment-form-assignment-dialog";
import { EnrollmentFormConfirm } from "@features/enrollment-forms/components/enrollment-form-confirm";
import { EnrollmentFormDiscardDialog } from "@features/enrollment-forms/components/enrollment-form-discard-dialog";
import { EnrollmentFormEditor } from "@features/enrollment-forms/components/enrollment-form-editor";
import { EnrollmentFormFeedback } from "@features/enrollment-forms/components/enrollment-form-feedback";
import { useEnrollmentFormMutation } from "@features/enrollment-forms/hooks/use-enrollment-form-admin";
import type { EnrollmentFormContext } from "@features/enrollment-forms/types/enrollment-form-context.types";
import type { EnrollmentFormVersion } from "@features/enrollment-forms/types/enrollment-form-version.types";
import { getEnrollmentFormVersionLabel } from "@features/enrollment-forms/utils/enrollment-form-version-label.util";

export function EnrollmentFormVersionSession({
  context,
  initial,
  modelName,
  onBack,
  onRename,
  onOpenHistory,
  onDirty,
  reload,
  onCreated,
}: {
  context: EnrollmentFormContext;
  initial: EnrollmentFormVersion;
  modelName: string;
  onBack: () => void;
  onRename: () => void;
  onOpenHistory: () => void;
  onDirty: (dirty: boolean) => void;
  reload: () => Promise<EnrollmentFormVersion>;
  onCreated: (version: EnrollmentFormVersion) => void;
}): ReactElement {
  const [version, setVersion] = useState(initial);

  const [dirty, setDirty] = useState(false);

  const [epoch, setEpoch] = useState(0);

  const versionLabel = getEnrollmentFormVersionLabel(version.versionNumber).toLowerCase();

  const [confirm, setConfirm] = useState<"publish" | "archive" | null>(null);

  const [assigning, setAssigning] = useState(false);

  const [discard, setDiscard] = useState(false);

  const [reloadError, setReloadError] = useState<unknown>();

  const [reloading, setReloading] = useState(false);

  const clone = useEnrollmentFormMutation<EnrollmentFormVersion>(context, onCreated);

  function markDirty(value: boolean) {
    setDirty(value);
    onDirty(value);
  }

  async function reloadVersion() {
    setDiscard(false);
    setReloading(true);
    setReloadError(undefined);

    try {
      setVersion(await reload());
      setEpoch((value) => value + 1);
      markDirty(false);
    } catch (error) {
      setReloadError(error);
    } finally {
      setReloading(false);
    }
  }

  return (
    <div className="space-y-4">
      <EnrollmentFormFeedback error={clone.error || reloadError} />
      <EnrollmentFormEditor
        key={`${version.id}:${epoch}`}
        context={context}
        version={version}
        onBack={onBack}
        actions={
          <>
            {context.canUpdate && version.status === "DRAFT" ? (
              <Button type="button" disabled={dirty || reloading} onClick={() => setConfirm("publish")}>
                Publicar
              </Button>
            ) : null}
            {!context.canUpdate ? <Badge variant="outline">Solo lectura</Badge> : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="icon-lg" aria-label="Más acciones del formulario">
                  <EllipsisVerticalIcon aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5">
                <DropdownMenuItem className="px-2.5 py-1.5" onSelect={onOpenHistory}>
                  Versiones e historial
                </DropdownMenuItem>
                {context.canUpdate ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="px-2.5 py-1.5" onSelect={onRename}>
                      Cambiar nombre
                    </DropdownMenuItem>
                    {version.status !== "DRAFT" ? (
                      <DropdownMenuItem
                        className="px-2.5 py-1.5"
                        disabled={clone.isPending || reloading}
                        onSelect={() => clone.mutate({ kind: "draft", formId: version.formId, sourceVersionId: version.id })}
                      >
                        {clone.isPending ? "Creando…" : "Crear nueva versión"}
                      </DropdownMenuItem>
                    ) : null}
                    {version.status === "PUBLISHED" ? (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="px-2.5 py-1.5" onSelect={() => setAssigning(true)}>
                          Asignar formulario
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" className="px-2.5 py-1.5" onSelect={() => setConfirm("archive")}>
                          Archivar
                        </DropdownMenuItem>
                      </>
                    ) : null}
                  </>
                ) : null}
                {initial.revision !== version.revision ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="px-2.5 py-1.5" disabled={reloading} onSelect={() => setDiscard(true)}>
                      Hay cambios más recientes: recargar
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
        onDirtyChange={markDirty}
        onReload={() => setDiscard(true)}
        onSaved={setVersion}
      />
      {confirm ? (
        <EnrollmentFormConfirm
          context={context}
          command={{ kind: confirm, formId: version.formId, versionId: version.id, expectedRevision: version.revision }}
          icon={confirm === "publish" ? SendIcon : ArchiveIcon}
          title={confirm === "publish" ? `Publicar la ${versionLabel}` : `Archivar la ${versionLabel}`}
          description={
            confirm === "publish"
              ? "La definición quedará bloqueada. Las asignaciones actuales y las inscripciones ya iniciadas no cambian. Después podés asignarla a un trayecto y ciclo."
              : "Solo se puede archivar una versión sin asignaciones vigentes. Las inscripciones anteriores conservarán sus preguntas y respuestas."
          }
          confirmLabel={confirm === "publish" ? "Publicar versión" : "Archivar versión"}
          pendingLabel={confirm === "publish" ? "Publicando…" : "Archivando…"}
          onClose={() => setConfirm(null)}
          onSuccess={(value) => setVersion(value as EnrollmentFormVersion)}
        />
      ) : null}
      {assigning ? (
        <EnrollmentFormAssignmentDialog context={context} version={version} modelName={modelName} onClose={() => setAssigning(false)} />
      ) : null}
      {discard ? <EnrollmentFormDiscardDialog onCancel={() => setDiscard(false)} onConfirm={() => void reloadVersion()} /> : null}
    </div>
  );
}

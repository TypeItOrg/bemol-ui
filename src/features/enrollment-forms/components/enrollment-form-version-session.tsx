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
  const [{ version, editorGeneration }, setEditor] = useState({ version: initial, editorGeneration: 0 });

  const [dirty, setDirty] = useState(false);

  const [dialog, setDialog] = useState<"publish" | "archive" | "assign" | "discard" | null>(null);

  const [reloadError, setReloadError] = useState<unknown>();

  const [reloading, setReloading] = useState(false);

  const hasNewerVersion = initial.revision > version.revision;

  if (hasNewerVersion && !dirty && !dialog && !reloading) {
    resetEditor(initial);
  }

  const clone = useEnrollmentFormMutation<EnrollmentFormVersion>(context, onCreated);

  const versionLabel = getEnrollmentFormVersionLabel(version.versionNumber).toLowerCase();

  function resetEditor(nextVersion: EnrollmentFormVersion) {
    setEditor((current) => ({ version: nextVersion, editorGeneration: current.editorGeneration + 1 }));
  }

  function acceptSave(nextVersion: EnrollmentFormVersion) {
    setEditor((current) => ({ ...current, version: nextVersion }));
  }

  function markDirty(value: boolean) {
    setDirty(value);
    onDirty(value);
  }

  async function reloadVersion() {
    setDialog(null);
    setReloading(true);
    setReloadError(undefined);

    try {
      resetEditor(await reload());
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
        key={editorGeneration}
        context={context}
        version={version}
        onBack={onBack}
        actions={
          <>
            {context.canUpdate && version.status === "DRAFT" ? (
              <Button type="button" disabled={dirty || reloading} onClick={() => setDialog("publish")}>
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
                        <DropdownMenuItem className="px-2.5 py-1.5" onSelect={() => setDialog("assign")}>
                          Asignar formulario
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" className="px-2.5 py-1.5" onSelect={() => setDialog("archive")}>
                          Archivar
                        </DropdownMenuItem>
                      </>
                    ) : null}
                  </>
                ) : null}
                {hasNewerVersion ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="px-2.5 py-1.5" disabled={reloading} onSelect={() => setDialog("discard")}>
                      Hay cambios más recientes: recargar
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
        onDirtyChange={markDirty}
        onReload={() => setDialog("discard")}
        onSaved={acceptSave}
      />
      {dialog === "publish" || dialog === "archive" ? (
        <EnrollmentFormConfirm
          context={context}
          command={{ kind: dialog, formId: version.formId, versionId: version.id, expectedRevision: version.revision }}
          icon={dialog === "publish" ? SendIcon : ArchiveIcon}
          title={dialog === "publish" ? `Publicar la ${versionLabel}` : `Archivar la ${versionLabel}`}
          description={
            dialog === "publish"
              ? "La definición quedará bloqueada. Las asignaciones actuales y las inscripciones ya iniciadas no cambian. Después podés asignarla a un trayecto y ciclo."
              : "Solo se puede archivar una versión sin asignaciones vigentes. Las inscripciones anteriores conservarán sus preguntas y respuestas."
          }
          confirmLabel={dialog === "publish" ? "Publicar versión" : "Archivar versión"}
          pendingLabel={dialog === "publish" ? "Publicando…" : "Archivando…"}
          onClose={() => setDialog(null)}
          onSuccess={(value) => acceptSave(value as EnrollmentFormVersion)}
        />
      ) : null}
      {dialog === "assign" ? (
        <EnrollmentFormAssignmentDialog context={context} version={version} modelName={modelName} onClose={() => setDialog(null)} />
      ) : null}
      {dialog === "discard" ? <EnrollmentFormDiscardDialog onCancel={() => setDialog(null)} onConfirm={() => void reloadVersion()} /> : null}
    </div>
  );
}

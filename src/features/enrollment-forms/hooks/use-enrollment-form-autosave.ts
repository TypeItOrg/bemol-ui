"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { useDebouncedValue } from "@common/hooks/use-debounced-value";

import { enrollmentFormQueryKey, useEnrollmentFormMutation } from "@features/enrollment-forms/hooks/use-enrollment-form-admin";
import { enrollmentFormDefinitionSchema } from "@features/enrollment-forms/schemas/enrollment-form-definition.schema";
import type { EnrollmentFormContext } from "@features/enrollment-forms/types/enrollment-form-context.types";
import type { EnrollmentFormDefinition } from "@features/enrollment-forms/types/enrollment-form-definition.types";
import type { EnrollmentFormVersion } from "@features/enrollment-forms/types/enrollment-form-version.types";
import { enrollmentFormIssueTarget, reconcileEnrollmentPdf } from "@features/enrollment-forms/utils/enrollment-form-editor.util";

export function useEnrollmentFormAutosave({
  context,
  version,
  onDirtyChange,
  onSaved,
}: {
  context: EnrollmentFormContext;
  version: EnrollmentFormVersion;
  onDirtyChange: (dirty: boolean) => void;
  onSaved: (version: EnrollmentFormVersion) => void;
}) {
  const [definition, setDefinition] = useState(version.definition);

  const signature = useMemo(() => JSON.stringify(definition), [definition]);

  const [savedSignature, setSavedSignature] = useState(signature);

  const [revision, setRevision] = useState(version.revision);

  const latestSignature = useRef(signature);

  const confirmedSignature = useRef(savedSignature);

  // Unconfirmed writes stay pending until retry or reload, even if the text is reverted.
  const submittedSignature = useRef<string | null>(null);

  const inFlight = useRef(false);

  const client = useQueryClient();

  const mutation = useEnrollmentFormMutation<EnrollmentFormVersion>(context, (result) => {
    const resultSignature = JSON.stringify(result.definition);

    if (latestSignature.current === submittedSignature.current) {
      latestSignature.current = resultSignature;
      setDefinition(result.definition);
    }

    confirmedSignature.current = resultSignature;
    submittedSignature.current = null;
    setSavedSignature(resultSignature);
    setRevision(result.revision);
    onDirtyChange(latestSignature.current !== resultSignature);
    onSaved(result);
    client.setQueryData(enrollmentFormQueryKey(context, `enrollment-forms/${version.formId}/versions/${version.id}`), result);
  });

  const { mutate, isPending: saving, isError: saveFailed } = mutation;

  const editable = context.canUpdate && version.status === "DRAFT";

  const dirty = signature !== savedSignature;

  const debouncedDefinition = useDebouncedValue(definition, 800);

  const parsed = useMemo(() => enrollmentFormDefinitionSchema.safeParse(debouncedDefinition), [debouncedDefinition]);

  const issue = editable && dirty && definition === debouncedDefinition && !parsed.success ? parsed.error.issues[0] : undefined;

  const target = issue && enrollmentFormIssueTarget(definition, issue.path);

  const validation = issue ? `${target?.sectionTitle || "Formulario"}: ${issue.message}` : undefined;

  let saveStatus = "Guardado";

  if (saving) {
    saveStatus = "Guardando…";
  } else if (saveFailed) {
    saveStatus = "No se pudo guardar";
  } else if (validation) {
    saveStatus = "Revisá los campos";
  } else if (dirty) {
    saveStatus = "Cambios pendientes";
  }

  useEffect(() => {
    if (
      !editable ||
      (!dirty && submittedSignature.current === null) ||
      definition !== debouncedDefinition ||
      saving ||
      saveFailed ||
      inFlight.current ||
      !parsed.success
    ) {
      return;
    }

    inFlight.current = true;
    submittedSignature.current = signature;
    onDirtyChange(true);

    mutate(
      { kind: "save", formId: version.formId, versionId: version.id, expectedRevision: revision, definition: parsed.data },
      {
        onSettled: () => {
          inFlight.current = false;
        },
      },
    );
  }, [
    editable,
    dirty,
    definition,
    signature,
    debouncedDefinition,
    saving,
    saveFailed,
    parsed,
    revision,
    mutate,
    onDirtyChange,
    version.formId,
    version.id,
  ]);

  useEffect(() => {
    if (!dirty && !saving && !saveFailed) {
      return;
    }

    const prevent = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", prevent);

    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty, saving, saveFailed]);

  function change(value: EnrollmentFormDefinition) {
    const next = reconcileEnrollmentPdf(value);

    latestSignature.current = JSON.stringify(next);
    setDefinition(next);
    onDirtyChange(submittedSignature.current !== null || latestSignature.current !== confirmedSignature.current);
  }

  return { definition, change, editable, revision, validation, saveStatus, mutation };
}

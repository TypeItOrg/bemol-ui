"use client";

import { useCallback, useRef, useState, type ReactElement } from "react";

import { Field, FieldError } from "@common/components/ui/field";
import { FileDropzone } from "@common/components/ui/file-dropzone";
import { FileUploadSelection } from "@common/components/ui/file-upload-selection";

import { DocumentFilePreview } from "@features/enrollment-applications/components/document-file-preview";
import { GUARDIAN_ATTACHMENT_ACCEPT } from "@features/guardian-dependents/constants/guardian-dependent.constants";
import { validateGuardianDocuments } from "@features/guardian-dependents/utils/guardian-dependent-documents.util";

const ACCEPTED_TYPES = GUARDIAN_ATTACHMENT_ACCEPT.split(",");

export function GuardianDependentDocumentsField({
  disabled,
  error,
  files,
  onChange,
}: {
  disabled: boolean;
  error?: string;
  files: File[];
  onChange: (files: File[]) => void;
}): ReactElement {
  const selectRef = useRef<HTMLButtonElement>(null);

  const [selectionError, setSelectionError] = useState<string>();

  const displayedError = selectionError ?? error;

  function selectFiles(selected: File[]): void {
    if (disabled || selected.length === 0) {
      return;
    }

    const nextFiles = [...files, ...selected];

    const nextError = validateGuardianDocuments(nextFiles);

    setSelectionError(nextError);

    onChange(nextFiles);
  }

  return (
    <Field aria-label="Documentación respaldatoria" data-invalid={Boolean(displayedError)}>
      <FileDropzone
        accept={ACCEPTED_TYPES}
        buttonRef={selectRef}
        description={
          <>
            Arrastrá tus <strong>documentos</strong> o <strong>imágenes</strong> o hacé clic para seleccionarlos.
          </>
        }
        disabled={disabled}
        dragTitle="Soltá tus documentos acá"
        error={displayedError}
        errorId="dependent-documents-error"
        inputLabel="Documentación respaldatoria"
        multiple
        onSelectFiles={selectFiles}
        selectLabel="Seleccionar documentación respaldatoria"
        title="Subí la documentación respaldatoria"
      />
      <FieldError id="dependent-documents-error">{displayedError}</FieldError>
      {files.map((file, index) => (
        <SelectedDocument
          disabled={disabled}
          file={file}
          key={`${file.name}-${index}`}
          label={`Documento seleccionado: ${file.name}`}
          name={file.name}
          onRemove={() => {
            const nextFiles = files.filter((_, fileIndex) => fileIndex !== index);

            onChange(nextFiles);
            setSelectionError(validateGuardianDocuments(nextFiles));
            selectRef.current?.focus();
          }}
          removeLabel={`Quitar ${file.name}`}
          statusLabel={displayedError ? "Revisá la selección" : ""}
        />
      ))}
    </Field>
  );
}

function SelectedDocument(props: Parameters<typeof FileUploadSelection>[0] & { file: File }): ReactElement {
  const [preview, setPreview] = useState<string>();

  const attachPreview = useCallback(
    (element: HTMLUListElement | null) => {
      if (!element) {
        return;
      }

      const url = URL.createObjectURL(props.file);

      setPreview(url);

      return () => URL.revokeObjectURL(url);
    },
    [props.file],
  );

  return (
    <FileUploadSelection
      {...props}
      ref={attachPreview}
      preview={preview ? <DocumentFilePreview src={preview} name={props.file.name} contentType={props.file.type} compact /> : undefined}
      previewAction={preview ? <DocumentFilePreview src={preview} name={props.file.name} contentType={props.file.type} iconOnly /> : undefined}
    />
  );
}

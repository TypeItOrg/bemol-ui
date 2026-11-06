"use client";

import type { ReactElement } from "react";

import { FileTextIcon, PenLineIcon } from "lucide-react";

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@common/components/ui/field";
import { InputGroup, InputGroupInput, InputGroupTextarea } from "@common/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@common/components/ui/select";

import { EnrollmentPdfCharacterCount } from "@features/enrollment-pdf/components/enrollment-pdf-character-count";
import type { EnrollmentPdfActionState } from "@features/enrollment-pdf/types/enrollment-pdf-action-state.types";
import type { EnrollmentPdfSettings } from "@features/enrollment-pdf/types/enrollment-pdf-settings.types";
import { FormCard } from "@features/institutions/components/institution-form-card";

export function EnrollmentPdfSettingsFields({
  values,
  errors = {},
  disabled,
  onChange,
}: {
  values: EnrollmentPdfSettings;
  errors: EnrollmentPdfActionState["fieldErrors"];
  disabled: boolean;
  onChange: <K extends keyof EnrollmentPdfSettings>(field: K, value: EnrollmentPdfSettings[K]) => void;
}): ReactElement {
  return (
    <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-6">
      <legend className="sr-only">Personalización de la planilla</legend>
      <FormCard icon={FileTextIcon} title="Contenido de la planilla" description="Título y textos que acompañan los datos de cada solicitud.">
        <FieldGroup className="gap-4">
          <Field data-invalid={!!errors.title}>
            <FieldLabel htmlFor="pdf-title" required>
              Título del documento
            </FieldLabel>
            <InputGroup className="h-9">
              <InputGroupInput
                id="pdf-title"
                name="title"
                className="pl-2 text-clip"
                value={values.title}
                maxLength={150}
                required
                aria-invalid={!!errors.title}
                aria-describedby="pdf-title-counter"
                aria-errormessage={errors.title ? "pdf-title-error" : undefined}
                onChange={(event) => onChange("title", event.target.value)}
              />
              <EnrollmentPdfCharacterCount id="pdf-title-counter" count={values.title.length} maxLength={150} align="inline-end" />
            </InputGroup>
            <FieldError id="pdf-title-error" errors={[errors.title ? { message: errors.title } : undefined]} />
          </Field>
          <Field data-invalid={!!errors.headerText}>
            <FieldLabel htmlFor="pdf-header">Encabezado complementario</FieldLabel>
            <InputGroup>
              <InputGroupTextarea
                id="pdf-header"
                name="headerText"
                value={values.headerText ?? ""}
                rows={3}
                maxLength={500}
                aria-invalid={!!errors.headerText}
                aria-describedby="pdf-header-description pdf-header-counter"
                aria-errormessage={errors.headerText ? "pdf-header-error" : undefined}
                onChange={(event) => onChange("headerText", event.target.value)}
              />
              <EnrollmentPdfCharacterCount id="pdf-header-counter" count={values.headerText?.length ?? 0} maxLength={500} />
            </InputGroup>
            <FieldDescription id="pdf-header-description">Debajo de los datos de la institución.</FieldDescription>
            <FieldError id="pdf-header-error" errors={[errors.headerText ? { message: errors.headerText } : undefined]} />
          </Field>
          <div className="grid min-w-0 gap-4 @2xl/field-group:grid-cols-2">
            <Field data-invalid={!!errors.introductionText}>
              <FieldLabel htmlFor="pdf-introduction">Introducción</FieldLabel>
              <InputGroup>
                <InputGroupTextarea
                  id="pdf-introduction"
                  name="introductionText"
                  value={values.introductionText ?? ""}
                  rows={4}
                  maxLength={1000}
                  aria-invalid={!!errors.introductionText}
                  aria-describedby="pdf-introduction-description pdf-introduction-counter"
                  aria-errormessage={errors.introductionText ? "pdf-introduction-error" : undefined}
                  onChange={(event) => onChange("introductionText", event.target.value)}
                />
                <EnrollmentPdfCharacterCount id="pdf-introduction-counter" count={values.introductionText?.length ?? 0} maxLength={1000} />
              </InputGroup>
              <FieldDescription id="pdf-introduction-description">Antes de los datos del estudiante.</FieldDescription>
              <FieldError id="pdf-introduction-error" errors={[errors.introductionText ? { message: errors.introductionText } : undefined]} />
            </Field>
            <Field data-invalid={!!errors.footerText}>
              <FieldLabel htmlFor="pdf-footer">Pie informativo</FieldLabel>
              <InputGroup>
                <InputGroupTextarea
                  id="pdf-footer"
                  name="footerText"
                  value={values.footerText ?? ""}
                  rows={4}
                  maxLength={500}
                  aria-invalid={!!errors.footerText}
                  aria-describedby="pdf-footer-counter"
                  aria-errormessage={errors.footerText ? "pdf-footer-error" : undefined}
                  onChange={(event) => onChange("footerText", event.target.value)}
                />
                <EnrollmentPdfCharacterCount id="pdf-footer-counter" count={values.footerText?.length ?? 0} maxLength={500} />
              </InputGroup>
              <FieldError id="pdf-footer-error" errors={[errors.footerText ? { message: errors.footerText } : undefined]} />
            </Field>
          </div>
        </FieldGroup>
      </FormCard>
      <FormCard icon={PenLineIcon} title="Espacios de firma" description="Espacios para firmar y aclarar en la planilla impresa.">
        <FieldGroup>
          <div className="grid min-w-0 gap-4 @2xl/field-group:grid-cols-2">
            <Field data-invalid={!!errors.showApplicantSignature}>
              <FieldLabel htmlFor="pdf-applicant-signature">Firma del solicitante</FieldLabel>
              {/* Hidden inputs submit values; keep Radix controls out of native form resets. */}
              <Select
                form=""
                value={String(values.showApplicantSignature)}
                disabled={disabled}
                onValueChange={(value) => onChange("showApplicantSignature", value === "true")}
              >
                <SelectTrigger
                  id="pdf-applicant-signature"
                  form=""
                  className="w-full"
                  aria-invalid={!!errors.showApplicantSignature}
                  aria-errormessage={errors.showApplicantSignature ? "pdf-applicant-signature-error" : undefined}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="true" className="px-2.5 py-1.5">
                      Incluir
                    </SelectItem>
                    <SelectItem value="false" className="px-2.5 py-1.5">
                      No incluir
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError
                id="pdf-applicant-signature-error"
                errors={[errors.showApplicantSignature ? { message: errors.showApplicantSignature } : undefined]}
              />
              <input type="hidden" name="showApplicantSignature" value={String(values.showApplicantSignature)} />
            </Field>
            <Field data-invalid={!!errors.showResponsibleSignature}>
              <FieldLabel htmlFor="pdf-responsible-signature">Firma del responsable</FieldLabel>
              <Select
                form=""
                value={String(values.showResponsibleSignature)}
                disabled={disabled}
                onValueChange={(value) => onChange("showResponsibleSignature", value === "true")}
              >
                <SelectTrigger
                  id="pdf-responsible-signature"
                  form=""
                  className="w-full"
                  aria-invalid={!!errors.showResponsibleSignature}
                  aria-errormessage={errors.showResponsibleSignature ? "pdf-responsible-signature-error" : undefined}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="true" className="px-2.5 py-1.5">
                      Incluir
                    </SelectItem>
                    <SelectItem value="false" className="px-2.5 py-1.5">
                      No incluir
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError
                id="pdf-responsible-signature-error"
                errors={[errors.showResponsibleSignature ? { message: errors.showResponsibleSignature } : undefined]}
              />
              <input type="hidden" name="showResponsibleSignature" value={String(values.showResponsibleSignature)} />
            </Field>
          </div>
        </FieldGroup>
      </FormCard>
    </fieldset>
  );
}

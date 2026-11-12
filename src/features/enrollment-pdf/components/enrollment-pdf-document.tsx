import type { ReactElement } from "react";

import { Document, Image, Page, Text, View } from "@react-pdf/renderer";

import { EnrollmentPdfFieldSection, missingStyle } from "@features/enrollment-pdf/components/enrollment-pdf-field-section";
import {
  ENROLLMENT_PDF_COLUMN_WIDTHS as COLUMN_WIDTHS,
  enrollmentPdfStyles as styles,
} from "@features/enrollment-pdf/constants/enrollment-pdf-document.styles";
import type { EnrollmentPdfData } from "@features/enrollment-pdf/types/enrollment-pdf-data.types";
import { formatEnrollmentPdfDate } from "@features/enrollment-pdf/utils/format-enrollment-pdf-date.util";

function DocumentEnd({ data }: { data: EnrollmentPdfData }): ReactElement {
  const { settings } = data;

  const responsible = settings.showResponsibleSignature && data.hasResponsible;

  return (
    <View>
      {settings.showApplicantSignature || responsible ? (
        <View style={[styles.signatures, settings.showApplicantSignature && responsible ? {} : styles.singleSignature]}>
          {settings.showApplicantSignature ? (
            <View style={styles.signature}>
              <Text style={styles.signatureText}>Firma y aclaración del solicitante</Text>
            </View>
          ) : null}
          {responsible ? (
            <View style={styles.signature}>
              <Text style={styles.signatureText}>Firma y aclaración del responsable</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      {settings.footerText ? (
        <View style={styles.closing}>
          <Text style={styles.footer}>{settings.footerText}</Text>
        </View>
      ) : null}
    </View>
  );
}

function SelectionRow({ selection }: { selection: EnrollmentPdfData["selections"][number] }): ReactElement {
  return (
    <View style={styles.tableRow}>
      <View style={[styles.cell, styles.firstCell, { width: COLUMN_WIDTHS[0] }]}>
        <Text style={[styles.cellText, styles.selectionName]}>{selection.name}</Text>
        <Text style={styles.selectionPlan}>{selection.studyPlan}</Text>
      </View>
      {[selection.level, selection.instrument, selection.status].map((value, index) => (
        <View key={index} style={[styles.cell, styles.cellDivider, { width: COLUMN_WIDTHS[index + 1] }]}>
          <Text style={[styles.cellText, missingStyle(value)]}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

export function EnrollmentPdfDocument({ data, logo }: { data: EnrollmentPdfData; logo?: string }): ReactElement {
  const { institution, settings } = data;

  const selections = data.selections.slice(0, -1);

  const lastSelection = data.selections.at(-1);

  const applicantDocument = data.sections
    .flatMap((section) => section.fields)
    .find((field) => field.label === "Documento nacional de identidad")
    ?.value.trim();

  const hasApplicantDocument = applicantDocument && applicantDocument !== "Sin informar";

  const documentTitle = `${hasApplicantDocument ? `${settings.title} - ${applicantDocument}` : settings.title} | ${institution.name} - Bemol`;

  const spaceLabel = data.coursesSelected ? "Curso" : "Espacio académico";

  return (
    <Document title={documentTitle} author={institution.name} creator="Bemol" producer="Bemol" language="es-AR">
      <Page size="A4" style={styles.page}>
        <View style={styles.form}>
          <View style={styles.institution} wrap={false}>
            {logo ? (
              <View style={styles.logoFrame}>
                {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf images have no alt attribute. */}
                <Image style={styles.logo} src={logo} />
              </View>
            ) : null}
            <View style={styles.institutionDetails}>
              <Text style={styles.institutionName}>{institution.name}</Text>
              <Text style={[styles.institutionContact, missingStyle(institution.address)]}>{institution.address}</Text>
              <View style={[styles.institutionContact, styles.institutionContacts]}>
                <Text style={[styles.contactText, missingStyle(institution.phone)]}>{institution.phone}</Text>
                <View style={styles.contactSeparator} />
                <Text style={[styles.contactText, missingStyle(institution.email)]}>{institution.email}</Text>
              </View>
              {settings.headerText ? <Text style={styles.institutionHeading}>{settings.headerText}</Text> : null}
            </View>
            <View style={[styles.metadata, data.submittedAt ? {} : { justifyContent: "center" }]}>
              {data.submittedAt ? (
                <View>
                  <Text style={styles.metadataTerm}>Fecha de presentación</Text>
                  <Text style={styles.metadataValue}>{formatEnrollmentPdfDate(data.submittedAt)}</Text>
                </View>
              ) : null}
              <View>
                <Text style={styles.metadataTerm}>Fecha de emisión</Text>
                <Text style={styles.metadataValue}>{formatEnrollmentPdfDate(data.generatedAt)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.identification} wrap={false}>
            <Text style={styles.title}>{settings.title}</Text>
          </View>
          {settings.introductionText ? <Text style={styles.introduction}>{settings.introductionText}</Text> : null}
          {data.sections.map((section, index) => [
            // Moves the section to the next page when its title would otherwise sit alone at the bottom.
            <View key={`space-${index}`} minPresenceAhead={70} />,
            <EnrollmentPdfFieldSection
              key={index}
              section={section}
              end={!lastSelection && index === data.sections.length - 1 ? <DocumentEnd data={data} /> : undefined}
            />,
          ])}
          {lastSelection ? <View minPresenceAhead={90} /> : null}
          {lastSelection ? (
            <View style={styles.grow}>
              <Text style={styles.heading} fixed minPresenceAhead={60}>
                {data.coursesSelected ? "Cursos solicitados" : "Espacios solicitados"}
              </Text>
              <View style={styles.tableRow} fixed minPresenceAhead={40}>
                {[spaceLabel, "Nivel", "Instrumento", "Estado"].map((label, index) => (
                  <Text key={label} style={[styles.headerCell, index ? styles.headerDivider : styles.firstCell, { width: COLUMN_WIDTHS[index] }]}>
                    {label}
                  </Text>
                ))}
              </View>
              {selections.map((selection, index) => (
                <View key={index} wrap={false}>
                  <SelectionRow selection={selection} />
                </View>
              ))}
              {/* The last row shares a print group with the signatures to avoid an isolated signature page. */}
              <View style={styles.grow} wrap={false}>
                <SelectionRow selection={lastSelection} />
                <View style={styles.grow} />
                <DocumentEnd data={data} />
              </View>
            </View>
          ) : null}
          {!lastSelection && !data.sections.length ? (
            <View style={styles.grow} wrap={false}>
              <View style={styles.grow} />
              <DocumentEnd data={data} />
            </View>
          ) : null}
        </View>
        {/* Close the frame at page breaks; continued pages already start with a repeated title border. */}
        <View
          fixed
          style={styles.frameLayer}
          // react-pdf passes totalPages to View render at runtime, but its View type omits it.
          render={(props) => {
            const { pageNumber, totalPages } = props as typeof props & { totalPages: number };

            return pageNumber < totalPages ? <View style={styles.frameBottom} /> : null;
          }}
        />
        <Text style={styles.pageNumber} fixed render={({ pageNumber, totalPages }) => `Página ${pageNumber} / ${totalPages}`} />
      </Page>
    </Document>
  );
}

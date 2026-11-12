import type { ReactElement, ReactNode } from "react";

import { Text, View } from "@react-pdf/renderer";

import { enrollmentPdfStyles as styles } from "@features/enrollment-pdf/constants/enrollment-pdf-document.styles";
import type { EnrollmentPdfData } from "@features/enrollment-pdf/types/enrollment-pdf-data.types";

type Section = EnrollmentPdfData["sections"][number];

const PAGE_CONTENT_HEIGHT = 700;

export function missingStyle(value: string) {
  return value === "Sin informar" ? styles.missing : {};
}

function pairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];

  for (let index = 0; index < items.length; index += 2) {
    rows.push(items.slice(index, index + 2));
  }

  return rows;
}

// Rough height in points; only decides whether a "keep together" section can fit on one page.
function estimatedHeight(fields: Section["fields"]): number {
  return pairs(fields).reduce((total, row) => total + 26 + Math.max(...row.map((field) => Math.ceil(field.value.length / 45) - 1)) * 12, 40);
}

function FieldRow({ row }: { row: Section["fields"] }): ReactElement {
  return (
    <View style={styles.fieldRow} wrap={false}>
      {row.map((field, index) => (
        <View key={index} style={styles.field}>
          <Text style={styles.label}>{field.label}</Text>
          <Text style={[styles.value, missingStyle(field.value)]}>{field.value}</Text>
        </View>
      ))}
    </View>
  );
}

// With an end, the last row stays with it at the bottom of the page, under the repeated title.
export function EnrollmentPdfFieldSection({ section, end }: { section: Section; end?: ReactNode }): ReactElement {
  const rows = pairs(section.fields);

  const body = end ? rows.slice(0, -1) : rows;

  const last = end ? rows.at(-1) : undefined;

  return (
    <View style={end ? styles.grow : {}} wrap={Boolean(end) || section.allowPageBreaks || estimatedHeight(section.fields) > PAGE_CONTENT_HEIGHT}>
      {/* Fixed inside its section: the title repeats only on the pages the section continues. */}
      <Text style={styles.heading} fixed minPresenceAhead={40}>
        {section.title}
      </Text>
      <View style={[styles.fields, end ? styles.grow : {}]}>
        {body.map((row, index) => (
          <FieldRow key={index} row={row} />
        ))}
        {end ? (
          <View style={styles.grow} wrap={false}>
            {last ? <FieldRow row={last} /> : null}
            <View style={styles.grow} />
            {end}
          </View>
        ) : null}
      </View>
    </View>
  );
}

import { StyleSheet } from "@react-pdf/renderer";

const FRAME = "0.75pt solid #333";

// One weight for every inner table line, so columns read as continuous rules from header to last row.
const GRID = "0.75pt solid #999";

export const ENROLLMENT_PDF_COLUMN_WIDTHS = ["40%", "17%", "22%", "21%"] as const;

export const enrollmentPdfStyles = StyleSheet.create({
  page: { paddingTop: "9mm", paddingHorizontal: "10mm", paddingBottom: "12mm", color: "#111", fontFamily: "Manrope", fontSize: 9 },
  pageNumber: { position: "absolute", left: "10mm", right: "10mm", bottom: "4.5mm", color: "#444", fontSize: 7.5, textAlign: "right" },
  frameLayer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  frameBottom: { position: "absolute", bottom: "12mm", left: "10mm", right: "10mm", borderTop: FRAME },
  // The form and its closing block grow so the signatures sit at the bottom of the last page.
  form: { flexGrow: 1, borderWidth: 0.75, borderStyle: "solid", borderColor: "#333" },
  grow: { flexGrow: 1 },
  // Inherited lineHeight hides react-pdf fixed render text, so each text sets its own size and leading.
  cellText: { fontSize: 8, lineHeight: 1.35 },
  contactText: { fontSize: 8, lineHeight: 1.35 },
  institution: { flexDirection: "row", alignItems: "stretch", gap: "4mm", padding: "4mm" },
  // The logo grows with the header text but never below a legible size.
  logoFrame: { position: "relative", width: "30mm", minHeight: "24mm" },
  logo: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "contain", objectPositionX: 0 },
  institutionDetails: { flexGrow: 1, flexBasis: 0, minWidth: 0, alignItems: "center", justifyContent: "center", textAlign: "center" },
  institutionName: { fontSize: 12, fontWeight: 700, lineHeight: 1.3 },
  institutionContact: { lineHeight: 1.35, marginTop: "1mm", color: "#444", fontSize: 8 },
  institutionContacts: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", columnGap: "3mm", rowGap: "1mm" },
  contactSeparator: { width: 0.75, height: "3mm", backgroundColor: "#999" },
  institutionHeading: { lineHeight: 1.35, marginTop: "2mm", color: "#444", fontSize: 8 },
  metadata: { width: "36mm", flexDirection: "column", justifyContent: "space-between", gap: "1.2mm" },
  // Labels are uppercase with a slightly smaller size and tracking, so they match the visual weight of sentence case.
  metadataTerm: { marginBottom: "0.6mm", color: "#444", fontSize: 7, lineHeight: 1.15, textTransform: "uppercase", letterSpacing: 0.3 },
  metadataValue: { fontSize: 8, lineHeight: 1.15 },
  // Each band draws only its top rule; the next heading draws the shared line, so no edge is doubled or offset.
  identification: {
    paddingVertical: "2.5mm",
    paddingHorizontal: "4mm",
    backgroundColor: "#444",
    color: "#fff",
    borderTop: FRAME,
  },
  title: { fontSize: 12, fontWeight: 700, lineHeight: 1.3, textAlign: "center", textTransform: "uppercase", letterSpacing: 0.48 },
  introduction: { fontSize: 9, lineHeight: 1.35, paddingVertical: "3mm", paddingHorizontal: "4mm" },
  heading: {
    paddingVertical: "1.5mm",
    paddingHorizontal: "4mm",
    backgroundColor: "#ededed",
    borderTop: FRAME,
    borderBottom: FRAME,
    fontSize: 8.5,
    fontWeight: 700,
    lineHeight: 1.3,
    textTransform: "uppercase",
    letterSpacing: 0.34,
  },
  // Each row carries its own top space so a row that starts a new page does not touch the repeated heading.
  fields: { paddingHorizontal: "4mm", paddingBottom: "3mm" },
  fieldRow: { flexDirection: "row", alignItems: "stretch", gap: "6mm", paddingTop: "2.5mm" },
  field: { flexGrow: 1, flexBasis: 0, minWidth: 0, flexDirection: "column" },
  label: { lineHeight: 1.35, marginBottom: "1mm", color: "#444", fontSize: 7.5, textTransform: "uppercase", letterSpacing: 0.3 },
  value: { lineHeight: 1.35, flexGrow: 1, minHeight: "5mm", paddingBottom: "1mm", borderBottom: "0.2mm solid #777", fontSize: 9 },
  missing: { color: "#666", fontStyle: "italic" },
  tableRow: { flexDirection: "row", alignItems: "stretch", fontSize: 8 },
  headerCell: {
    lineHeight: 1.35,
    paddingVertical: "2mm",
    paddingHorizontal: "1.5mm",
    borderBottom: FRAME,
    fontSize: 7.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  headerDivider: { borderLeft: GRID, textAlign: "center" },
  cell: { paddingVertical: "2mm", paddingHorizontal: "1.5mm", borderBottom: GRID },
  cellDivider: { borderLeft: GRID, alignItems: "center", justifyContent: "center", textAlign: "center" },
  firstCell: { paddingLeft: "4mm" },
  selectionName: { fontWeight: 500 },
  selectionPlan: { lineHeight: 1.35, marginTop: "0.8mm", color: "#444", fontSize: 7.5 },
  signatures: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: "10mm",
    paddingTop: "20mm",
    paddingHorizontal: "4mm",
    paddingBottom: "4mm",
  },
  singleSignature: { justifyContent: "center" },
  signature: {
    lineHeight: 1.35,
    flexGrow: 1,
    flexBasis: 0,
    minWidth: "60mm",
    maxWidth: "85mm",
    paddingTop: "2mm",
    borderTop: "0.2mm solid #333",
    fontSize: 8,
    textAlign: "center",
  },
  // Manrope has no italic face, so the caption is slanted like a synthetic oblique.
  signatureText: { transform: "skewX(-10deg)" },
  closing: { paddingVertical: "3mm", paddingHorizontal: "4mm", borderTop: "0.2mm solid #999" },
  footer: { lineHeight: 1.35, fontSize: 8 },
});

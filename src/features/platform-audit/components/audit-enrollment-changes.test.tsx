import { render, screen, within } from "@testing-library/react";

import { AuditComparisonTable } from "@features/platform-audit/components/audit-comparison-table";
import { auditOperationRows } from "@features/platform-audit/components/audit-operation-changes";

it("muestra estados de cursada y situación académica desde las etiquetas del evento", () => {
  const rows = auditOperationRows({
    fieldLabels: { status: "Estado de cursada", academicStatus: "Situación académica" },
    changedFields: ["status", "academicStatus"],
    before: { status: { code: "ENROLLED", label: "En curso" }, academicStatus: { code: "IN_PROGRESS", label: "En curso" } },
    after: { status: { code: "COMPLETED", label: "Finalizada" }, academicStatus: { code: "PASSED", label: "Aprobado" } },
  });
  render(<AuditComparisonTable label="Cambios" rows={rows} />);
  expect(screen.getByRole("rowheader", { name: "Estado de cursada" })).toBeInTheDocument();
  expect(screen.getByRole("rowheader", { name: "Situación académica" })).toBeInTheDocument();
  expect(screen.getByText("Finalizada")).toBeInTheDocument();
  expect(screen.getByText("Aprobado")).toBeInTheDocument();
  expect(screen.queryByText("PASSED")).not.toBeInTheDocument();
});

it("presenta metadatos del adjunto sin necesitar reglas por entidad", () => {
  render(
    <AuditComparisonTable
      label="Cambios"
      rows={auditOperationRows({
        fieldLabels: { reviewStatus: "Revisión", contentType: "Formato del archivo", size: "Tamaño del archivo" },
        before: {},
        after: { reviewStatus: { code: "OBSERVED", label: "Observado" }, contentType: "application/pdf", size: 128 },
      })}
    />,
  );
  expect(screen.getByText("Observado")).toBeInTheDocument();
  expect(screen.getByText("application/pdf")).toBeInTheDocument();
  expect(screen.getByText("128 bytes")).toBeInTheDocument();
});

it("distingue el motivo no registrado del número de requisitos solicitado", () => {
  render(
    <AuditComparisonTable
      label="Cambios"
      rows={auditOperationRows({
        fieldLabels: { requestReason: "Motivo del pedido", requirementCount: "Requisitos solicitados" },
        changedFields: ["requestReason", "requirementCount"],
        before: {},
        after: { requirementCount: 3 },
      })}
    />,
  );
  const reason = screen.getByRole("rowheader", { name: "Motivo del pedido" }).closest("tr");
  expect(within(reason!).getAllByText("No registrado")).toHaveLength(2);
  expect(screen.getByText("3")).toBeInTheDocument();
});

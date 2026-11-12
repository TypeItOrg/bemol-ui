import { render, screen } from "@testing-library/react";

import { auditOperationRows } from "@features/platform-audit/components/audit-operation-changes";
import { AuditValue } from "@features/platform-audit/components/audit-value";

it("muestra un atributo nuevo con la etiqueta de la entidad sin modificar catálogos", () => {
  expect(
    auditOperationRows({
      fieldLabels: { customAttribute: "Atributo propio" },
      changedFields: ["customAttribute"],
      before: { customAttribute: "Anterior" },
      after: { customAttribute: "Nuevo" },
    }),
  ).toEqual([{ key: "customAttribute", label: "Atributo propio", before: "Anterior", after: "Nuevo" }]);
});

it("muestra cambios privados por nombre sin inventar valores", () => {
  expect(
    auditOperationRows({
      fieldLabels: { privateAttribute: "Dato privado" },
      changedFields: ["privateAttribute"],
      before: {},
      after: {},
    }),
  ).toEqual([{ key: "privateAttribute", label: "Dato privado", before: "No registrado", after: "No registrado" }]);
});

it("no oculta una referencia cambiada cuando coincide su nombre visible", () => {
  expect(
    auditOperationRows({
      fieldLabels: { nationalityCountry: "Nacionalidad" },
      changedFields: ["nationalityCountry"],
      before: { nationalityCountry: "Mismo nombre" },
      after: { nationalityCountry: "Mismo nombre" },
    }),
  ).toEqual([{ key: "nationalityCountry", label: "Nacionalidad", before: "Mismo nombre", after: "Mismo nombre" }]);
});

it("ignora etiquetas malformadas y no reconstruye campos sin metadatos", () => {
  expect(auditOperationRows({ fieldLabels: { customAttribute: 123 }, changedFields: ["customAttribute"], before: {}, after: {} })).toEqual([]);
  expect(auditOperationRows({ before: { name: "Anterior" }, after: { name: "Nuevo" } })).toEqual([]);
});

it("distingue nulo, estado no registrado y lista vacía", () => {
  expect(auditOperationRows({ fieldLabels: { customAttribute: "Dato" }, after: { customAttribute: null } })).toEqual([
    { key: "customAttribute", label: "Dato", before: "Sin estado registrado", after: "Sin especificar" },
  ]);
  expect(auditOperationRows({ fieldLabels: { customAttribute: "Datos" }, after: { customAttribute: [] } })).toEqual([
    { key: "customAttribute", label: "Datos", before: "Sin estado registrado", after: "Ninguno" },
  ]);
});

it("no duplica requisitos con etiquetas propias ni presenta como vacía una modificación privada", () => {
  const before = { requirements: [{ trainingPathName: "Trayecto", level: "AT_SUBMISSION", active: true }] };

  const rows = auditOperationRows({
    fieldLabels: { requirements: "Asignaciones documentales" },
    changedFields: ["requirements"],
    before,
    after: before,
  });

  expect(rows).toEqual([{ key: "requirements", label: "Asignaciones documentales", before: "No registrado", after: "No registrado" }]);
  expect(
    auditOperationRows({ fieldLabels: { requirements: "Asignaciones documentales" }, before: { requirements: [] }, after: before }).filter(
      (row) => row.key === "requirements",
    ),
  ).toHaveLength(1);
});

it("presenta grupos anidados con sus etiquetas sin mostrar referencias técnicas", () => {
  const value = [
    {
      roleId: "internal-id",
      roleName: "Docente",
      accessScopeName: "Toda la institución",
      fieldLabels: { roleName: "Rol", accessScopeName: "Alcance" },
    },
  ];
  const original = JSON.stringify(value);
  render(<AuditValue field="roles" value={value} />);
  expect(screen.getByText("Docente")).toBeInTheDocument();
  expect(screen.getByText("Toda la institución")).toBeInTheDocument();
  expect(screen.queryByText("internal-id")).not.toBeInTheDocument();
  expect(JSON.stringify(value)).toBe(original);
});

it("presenta códigos con etiqueta y horarios agrupados sin perder detalle", () => {
  render(
    <AuditValue
      field="classes"
      value={[
        {
          fieldLabels: { classNumber: "Clase", schedules: "Horarios", permissions: "Permisos" },
          classNumber: 2,
          schedules: [{ fieldLabels: { startTime: "Desde", endTime: "Hasta" }, startTime: "14:00", endTime: "16:00" }],
          permissions: [{ code: "PRIVATE_CODE", label: "Consultar datos" }],
        },
      ]}
    />,
  );
  expect(screen.getByText("14:00")).toBeInTheDocument();
  expect(screen.getByText("16:00")).toBeInTheDocument();
  expect(screen.getByText("Consultar datos")).toBeInTheDocument();
  expect(screen.queryByText("PRIVATE_CODE")).not.toBeInTheDocument();
});

it("no presenta valores idénticos como si explicaran un cambio privado anidado", () => {
  const roles = [{ roleName: "Docente", fieldLabels: { roleName: "Rol" } }];
  expect(auditOperationRows({ fieldLabels: { roles: "Roles" }, changedFields: ["roles"], before: { roles }, after: { roles } })).toEqual([
    { key: "roles", label: "Roles", before: "No registrado", after: "No registrado" },
  ]);
});

it("distingue acceso institucional, acceso propio y verificación con las etiquetas de la cuenta", () => {
  const rows = auditOperationRows({
    fieldLabels: {
      enabled: "Acceso institucional habilitado",
      selfAccessEnabled: "Acceso propio habilitado",
      emailVerificationStatus: "Verificación de correo",
    },
    changedFields: ["selfAccessEnabled", "emailVerificationStatus"],
    before: { enabled: true, selfAccessEnabled: false, emailVerificationStatus: { code: "PENDING", label: "Pendiente" } },
    after: { enabled: true, selfAccessEnabled: true, emailVerificationStatus: { code: "VERIFIED", label: "Verificada" } },
  });
  expect(rows.map((row) => row.label)).toEqual(["Acceso propio habilitado", "Verificación de correo"]);
  expect(rows[0].before).toBe("No");
  expect(rows[0].after).toBe("Sí");
  render(
    <>
      {rows[1].before}
      {rows[1].after}
    </>,
  );
  expect(screen.getByText("Pendiente")).toBeInTheDocument();
  expect(screen.getByText("Verificada")).toBeInTheDocument();
  expect(screen.queryByText("VERIFIED")).not.toBeInTheDocument();
});

it("presenta contraseñas y correos modificados sólo como valores no registrados", () => {
  expect(
    auditOperationRows({
      fieldLabels: { password: "Contraseña", email: "Correo electrónico" },
      changedFields: ["password", "email"],
      before: {},
      after: {},
    }),
  ).toEqual([
    { key: "password", label: "Contraseña", before: "No registrado", after: "No registrado" },
    { key: "email", label: "Correo electrónico", before: "No registrado", after: "No registrado" },
  ]);
});

it("formatea fechas nuevas por tipo sin agregar nombres de campos al frontend", () => {
  const rows = auditOperationRows({
    fieldLabels: { customDate: "Fecha propia", customInstant: "Instante propio" },
    before: {},
    after: {
      customDate: { type: "DATE", value: "2026-11-11" },
      customInstant: { type: "DATETIME", value: "2026-11-11T15:30:00Z" },
    },
  });
  render(
    <>
      {rows.map((row) => (
        <div key={row.key}>{row.after}</div>
      ))}
    </>,
  );
  expect(screen.getByText("11/11/2026")).toBeInTheDocument();
  expect(screen.getByText(/12:30:00/)).toBeInTheDocument();
});

it("usa sólo los campos declarados cuando el evento tiene etiquetas propias", () => {
  expect(
    auditOperationRows({ fieldLabels: { customAttribute: "Dato" }, before: { name: "Valor sin declarar" }, after: { customAttribute: "Visible" } }),
  ).toEqual([{ key: "customAttribute", label: "Dato", before: "Sin estado registrado", after: "Visible" }]);
});

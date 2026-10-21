import { render, screen, within } from "@testing-library/react";

import { AuditEventDetail } from "@features/platform-audit/components/audit-event-detail";
import type { AuditEntityChange } from "@features/platform-audit/types/audit-entity-change.types";
import type { AuditEvent } from "@features/platform-audit/types/audit-event.types";

it("integra valores anteriores y nuevos, horarios de 24 horas y estados sin historial sin mostrar secciones vacías", () => {
  const event: AuditEvent = {
    id: "evento-tecnico",
    actorKind: "ANONYMOUS",
    actorId: null,
    actorName: null,
    subjectPersonId: null,
    subjectName: null,
    institutionId: null,
    institutionName: null,
    action: "SHIFT_UPDATED",
    entityType: "SHIFT",
    entityId: "entidad-tecnica",
    actedOnBehalf: false,
    requestId: null,
    origin: "PLATFORM_ADMINISTRATION",
    occurredAt: "2026-10-18T21:00:00Z",
    details: {
      changedFields: ["name", "description", "allowedFormats", "year"],
      before: { name: "Registro anterior", active: true, allowedFormats: ["image/png"], year: 2025 },
      after: { name: "Registro actual", active: true, allowedFormats: ["image/jpeg"], year: 2026 },
    },
    history: {
      revision: 12,
      changes: [
        {
          entity: "Turno",
          entityId: "entidad-tecnica",
          operation: "UPDATED",
          previousKnown: true,
          fields: [
            { field: "name", label: "Nombre", valueType: "TEXT", before: "Mañana", after: "Matutino" },
            { field: "start_time", label: "Hora de inicio", valueType: "TIME", before: "13:00:00", after: "14:30:00" },
            { field: "active", label: "Activo", valueType: "BOOLEAN", before: "true", after: "false" },
            { field: "allowed_formats", label: "Formatos permitidos", valueType: "JSON", before: '["application/pdf"]', after: "[]" },
            { field: "day_of_week", label: "Día de la semana", valueType: "TEXT", before: "MONDAY", after: "TUESDAY" },
            { field: "deleted_at", label: "Fecha de eliminación", valueType: "DATETIME", before: null, after: "2026-10-18T22:45:30Z" },
          ],
        },
        {
          entity: "Otro turno",
          entityId: "sin-baseline",
          operation: "UPDATED",
          previousKnown: false,
          fields: [{ field: "name", label: "Nombre", valueType: "TEXT", before: null, after: "Turno legado" }],
        },
      ],
    },
  };
  const props = { returnTo: "/admin/audit-events?page=2", roleLabels: {}, permissionLabels: {} };
  const { rerender, container } = render(<AuditEventDetail event={event} {...props} />);

  expect(screen.queryByRole("heading", { name: "Turno actualizado" })).not.toBeInTheDocument();
  expect(screen.getByText("Acción")).toBeInTheDocument();
  expect(screen.getByText("Turno actualizado")).toBeInTheDocument();
  expect(screen.getByText("Fecha y hora")).toBeInTheDocument();
  expect(screen.queryByText("Nombres actuales.")).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Datos del evento" })).toBeInTheDocument();
  expect(screen.getByText("Qué ocurrió, cuándo y quién lo realizó.")).toBeInTheDocument();
  expect(screen.getByText("Campos modificados y sus valores anteriores y nuevos.")).toBeInTheDocument();
  const table = screen.getByRole("table", { name: "Cambios" });
  expect(screen.getAllByRole("table")).toHaveLength(1);
  expect(screen.queryByRole("heading", { name: "Cambios registrados" })).not.toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Detalles de la operación" })).not.toBeInTheDocument();
  expect(
    within(table)
      .getAllByRole("columnheader")
      .map((column) => column.textContent),
  ).toEqual(["Campo", "Valor anterior", "Valor nuevo"]);
  expect(screen.queryByText("Registro anterior")).not.toBeInTheDocument();
  expect(screen.queryByText("Registro actual")).not.toBeInTheDocument();
  expect(within(table).queryByText("image/png")).not.toBeInTheDocument();
  expect(within(table).queryByText("image/jpeg")).not.toBeInTheDocument();
  expect(within(table).queryByText("Estado")).not.toBeInTheDocument();
  expect(within(table).getByText("2025")).toBeInTheDocument();
  expect(screen.queryByText("evento-tecnico")).not.toBeInTheDocument();
  expect(screen.queryByText("entidad-tecnica")).not.toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Información técnica" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Información técnica" })).not.toBeInTheDocument();
  expect(screen.queryByText("Tipo de actor")).not.toBeInTheDocument();

  expect(screen.getByText("Mañana")).toBeInTheDocument();
  expect(screen.getByText("Matutino")).toBeInTheDocument();
  expect(screen.getByText("13:00:00")).toBeInTheDocument();
  expect(screen.getByText("14:30:00")).toBeInTheDocument();
  expect(screen.getByText(/19:45:30/)).toBeInTheDocument();
  expect(screen.getByText("Lunes")).toBeInTheDocument();
  expect(screen.getByText("Martes")).toBeInTheDocument();
  expect(screen.getByText("application/pdf")).toBeInTheDocument();
  expect(screen.getByText("Ninguno")).toBeInTheDocument();
  expect(screen.getByText("Descripción")).toBeInTheDocument();
  expect(within(screen.getByText("Turno legado").closest("tr")!).getByText("No registrado")).toBeInTheDocument();
  expect(within(screen.getByText("Descripción").closest("tr")!).getAllByText("No registrado")).toHaveLength(2);
  expect(screen.getByText("Turno legado")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Volver" })).toHaveAttribute("href", props.returnTo);
  expect(container.textContent).not.toMatch(/a\.\s?m\.|p\.\s?m\./i);

  rerender(<AuditEventDetail event={{ ...event, history: { revision: 12, changes: [] }, details: {} }} {...props} />);
  expect(screen.queryByRole("heading", { name: "Cambios" })).not.toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();

  rerender(
    <AuditEventDetail
      event={{ ...event, history: null, details: { before: { name: "Turno anterior" }, after: { name: "Turno nuevo" } } }}
      {...props}
    />,
  );
  expect(screen.getByText("Turno anterior")).toBeInTheDocument();
  expect(screen.getByText("Turno nuevo")).toBeInTheDocument();

  rerender(
    <AuditEventDetail
      event={{
        ...event,
        details: { before: { name: "Nombre anterior conocido" }, after: { name: "Nombre posterior conocido" } },
        history: {
          revision: 13,
          changes: [
            {
              entity: "Turno",
              entityId: event.entityId,
              operation: "UPDATED",
              previousKnown: false,
              fields: [{ field: "name", label: "Nombre", valueType: "TEXT", before: null, after: "Nombre posterior conocido" }],
            },
          ],
        },
      }}
      {...props}
    />,
  );
  expect(screen.getAllByRole("table")).toHaveLength(1);
  expect(screen.getByText("Nombre anterior conocido")).toBeInTheDocument();
  expect(screen.getAllByText("Nombre posterior conocido")).toHaveLength(1);
});

it("mantiene roles, permisos, documentación y datos de alta en tablas sin publicar valores privados", () => {
  const event: AuditEvent = {
    id: "evento-roles",
    actorKind: "PLATFORM",
    actorId: "cuenta-tecnica",
    actorName: "Administradora QA",
    subjectPersonId: null,
    subjectName: null,
    institutionId: null,
    institutionName: null,
    action: "PERSON_ROLES_CHANGED",
    entityType: "PERSON",
    entityId: "persona-tecnica",
    actedOnBehalf: false,
    requestId: "peticion-tecnica",
    origin: "PLATFORM_ADMINISTRATION",
    occurredAt: "2026-10-18T21:00:00Z",
    history: null,
    details: {
      before: [
        {
          roleId: "rol-anterior",
          roleName: "Coordinación anterior",
          accessScope: "TRAINING_PATHS",
          trainingPathIds: ["trayecto-anterior"],
          password: "VALOR_PRIVADO",
        },
      ],
      after: [{ roleId: "rol-nuevo", roleName: "Coordinación actual", accessScope: "INSTITUTION", trainingPathIds: [] }],
    },
  };
  const props = {
    returnTo: "/admin/audit-events",
    roleLabels: { APPLICANT: "Postulante" },
    permissionLabels: { COURSE_READ: "Ver cursos", COURSE_WRITE: "Editar cursos" },
  };
  const { rerender, container } = render(<AuditEventDetail event={event} {...props} />);
  expect(screen.queryByText("Administrador de plataforma")).not.toBeInTheDocument();
  expect(screen.getByText("Administradora QA")).toBeInTheDocument();
  let table = screen.getByRole("table", { name: "Cambios" });
  expect(within(table).getByText("Coordinación anterior")).toBeInTheDocument();
  expect(within(table).getByText("Coordinación actual")).toBeInTheDocument();
  expect(screen.queryByText("rol-anterior")).not.toBeInTheDocument();
  expect(screen.queryByText("trayecto-anterior")).not.toBeInTheDocument();
  expect(screen.queryByText("peticion-tecnica")).not.toBeInTheDocument();
  expect(container.textContent).not.toContain("VALOR_PRIVADO");

  rerender(
    <AuditEventDetail
      event={{
        ...event,
        action: "ROLE_UPDATED",
        history: {
          revision: 14,
          changes: [
            {
              entity: "Permiso del rol",
              entityId: "permiso-tecnico",
              operation: "CREATED",
              previousKnown: true,
              fields: [{ field: "permission_id", label: "Permiso", valueType: "REFERENCE", before: null, after: "referencia-permiso" }],
            },
          ],
        },
        details: {
          before: { name: "Rol anterior", permissions: ["COURSE_READ"] },
          after: { name: "Rol actual", permissions: ["COURSE_WRITE"] },
        },
      }}
      {...props}
    />,
  );
  table = screen.getByRole("table", { name: "Cambios" });
  expect(within(table).getByText("Ver cursos")).toBeInTheDocument();
  expect(within(table).getByText("Editar cursos")).toBeInTheDocument();
  expect(screen.getAllByRole("table")).toHaveLength(1);
  expect(screen.queryByText("referencia-permiso")).not.toBeInTheDocument();

  rerender(
    <AuditEventDetail
      event={{
        ...event,
        action: "DOCUMENT_DEFINITION_UPDATED",
        details: {
          before: { requirements: [] },
          after: {
            requirements: [
              { trainingPathName: "Trayecto musical", level: "BEFORE_CONFIRMATION", displayOrder: 2, active: true, storagePath: "VALOR_PRIVADO" },
            ],
          },
        },
      }}
      {...props}
    />,
  );
  table = screen.getByRole("table", { name: "Cambios" });
  expect(within(table).getByText("Asignaciones documentales")).toBeInTheDocument();
  expect(within(table).getByText("Sin asignaciones.")).toBeInTheDocument();
  expect(within(table).getByText("Trayecto musical")).toBeInTheDocument();
  expect(container.textContent).not.toContain("VALOR_PRIVADO");

  rerender(
    <AuditEventDetail
      event={{ ...event, action: "INSTITUTIONAL_ACCOUNT_CREATED", details: { initialRole: "APPLICANT", hasAccount: true } }}
      {...props}
    />,
  );
  table = screen.getByRole("table", { name: "Cambios" });
  expect(
    within(table)
      .getAllByRole("columnheader")
      .map((column) => column.textContent),
  ).toEqual(["Campo", "Valor anterior", "Valor nuevo"]);
  expect(within(table).getByText("Postulante")).toBeInTheDocument();

  rerender(
    <AuditEventDetail event={{ ...event, action: "INSTITUTIONAL_ACCESS_CHANGED", details: { previousEnabled: true, enabled: false } }} {...props} />,
  );
  table = screen.getByRole("table", { name: "Cambios" });
  expect(within(table).getByText("Acceso")).toBeInTheDocument();
  expect(within(table).getByText("Habilitado")).toBeInTheDocument();
  expect(within(table).getByText("Deshabilitado")).toBeInTheDocument();

  rerender(<AuditEventDetail event={{ ...event, action: "PERSON_UPDATED", details: { changedFields: ["firstName"] } }} {...props} />);
  table = screen.getByRole("table", { name: "Cambios" });
  expect(within(table).getByText("Nombre")).toBeInTheDocument();
  expect(within(table).getAllByText("No registrado")).toHaveLength(2);

  rerender(
    <AuditEventDetail event={{ ...event, action: "SHIFT_UPDATED", details: { before: { unknown: "VALOR_PRIVADO" }, after: {} } }} {...props} />,
  );
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(container.textContent).not.toContain("VALOR_PRIVADO");

  rerender(
    <AuditEventDetail
      event={{
        ...event,
        action: "EMAIL_SENT",
        entityType: "EMAIL",
        details: { mailType: "Recuperación de contraseña", recipient: "qa@example.test" },
      }}
      {...props}
    />,
  );
  expect(screen.getByRole("heading", { name: "Datos del correo" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Cambios" })).not.toBeInTheDocument();
  expect(screen.getByText("qa@example.test")).toBeInTheDocument();
});

it("compara cupos y horarios sin confundir clases ni inventar estados ni volcar el historial interno en pantalla", () => {
  const snapshots = (
    prefix: string,
    operation: "CREATED" | "DELETED",
    number: number,
    capacity: string,
    start: string,
    end: string,
  ): AuditEntityChange[] => {
    const snapshot = (entity: string, entityId: string, values: Record<string, string>): AuditEntityChange => ({
      entity,
      entityId,
      operation,
      previousKnown: true,
      fields: Object.entries(values).map(([field, value]) => ({
        field,
        label: field,
        valueType: field.endsWith("_id") ? "REFERENCE" : "TEXT",
        before: operation === "DELETED" ? value : null,
        after: operation === "CREATED" ? value : null,
      })),
    });

    return [
      snapshot("Clase", `${prefix}-class`, { class_number: String(number), course_id: "curso-qa", institution_id: "institucion-qa" }),
      snapshot("Docente de clase", `${prefix}-teacher`, { course_class_id: `${prefix}-class`, person_id: "docente-qa" }),
      snapshot("Día de clase", `${prefix}-day`, { course_class_id: `${prefix}-class`, day_of_week: "MONDAY", capacity }),
      snapshot("Horario de clase", `${prefix}-schedule`, { course_class_day_id: `${prefix}-day`, start_time: start, end_time: end }),
    ];
  };

  const original = snapshots("old", "DELETED", 1, "20", "09:00:00", "10:00:00");
  const replacement = snapshots("new", "CREATED", 1, "25", "10:30:00", "11:30:00");
  const event: AuditEvent = {
    id: "evento-curso",
    actorKind: "PLATFORM",
    actorId: "actor-qa",
    actorName: "Administradora QA",
    subjectPersonId: null,
    subjectName: null,
    institutionId: "institucion-qa",
    institutionName: "Institución QA",
    action: "COURSE_CLASSES_CHANGED",
    entityType: "COURSE",
    entityId: "curso-qa",
    actedOnBehalf: false,
    requestId: "peticion-qa",
    origin: "PLATFORM_ADMINISTRATION",
    occurredAt: "2026-10-18T22:18:38Z",
    details: { entityName: "Curso QA", changedFields: ["classes"], before: { classCount: 1 }, after: { classCount: 1 } },
    history: { revision: 20, changes: [...original, ...replacement] },
  };
  const props = { returnTo: "/admin/audit-events", roleLabels: {}, permissionLabels: {} };
  const preservedHistory = JSON.stringify(event.history);
  const { rerender, container } = render(<AuditEventDetail event={event} {...props} />);
  const table = screen.getByRole("table", { name: "Cambios" });
  expect(within(table).getAllByRole("row")).toHaveLength(3);
  expect(
    within(within(table).getByRole("row", { name: /Cupo.*Clase 1 · Lunes/ }))
      .getAllByRole("cell")
      .map((cell) => cell.textContent),
  ).toEqual(["20", "25"]);
  expect(within(table).getByText("09:00:00–10:00:00")).toBeInTheDocument();
  expect(within(table).getByText("10:30:00–11:30:00")).toBeInTheDocument();
  expect(container.textContent).not.toMatch(/old-class|new-class|institucion-qa|Creación|Eliminación|No registrado/);
  expect(screen.queryByRole("table", { name: "Historial técnico" })).not.toBeInTheDocument();
  expect(screen.getAllByRole("table")).toHaveLength(1);
  expect(screen.queryByText("peticion-qa")).not.toBeInTheDocument();
  expect(JSON.stringify(event.history)).toBe(preservedHistory);

  rerender(
    <AuditEventDetail
      {...props}
      event={{ ...event, history: { revision: 21, changes: [...original, ...snapshots("same", "CREATED", 1, "20", "09:00:00", "10:00:00")] } }}
    />,
  );
  expect(screen.queryByRole("table", { name: "Cambios" })).not.toBeInTheDocument();

  rerender(
    <AuditEventDetail
      {...props}
      event={{
        ...event,
        history: {
          revision: 22,
          changes: [
            ...original,
            ...replacement,
            ...snapshots("old2", "DELETED", 2, "5", "14:00:00", "15:00:00"),
            ...snapshots("new2", "CREATED", 2, "8", "15:00:00", "16:00:00"),
          ],
        },
      }}
    />,
  );
  const multi = screen.getByRole("table", { name: "Cambios" });
  expect(within(multi).getAllByRole("row")).toHaveLength(5);
  expect(
    within(within(multi).getByRole("row", { name: /Cupo.*Clase 2 · Lunes/ }))
      .getAllByRole("cell")
      .map((cell) => cell.textContent),
  ).toEqual(["5", "8"]);
  expect(within(multi).getByText("14:00:00–15:00:00")).toBeInTheDocument();

  rerender(
    <AuditEventDetail
      {...props}
      event={{
        ...event,
        history: {
          revision: 23,
          changes: [
            {
              entity: "Día de clase",
              entityId: "legacy-day",
              operation: "UPDATED",
              previousKnown: false,
              fields: [{ field: "capacity", label: "Cupo", valueType: "NUMBER", before: null, after: "25" }],
            },
          ],
        },
      }}
    />,
  );
  expect(within(screen.getByRole("table", { name: "Cambios" })).getByText("No registrado")).toBeInTheDocument();
});

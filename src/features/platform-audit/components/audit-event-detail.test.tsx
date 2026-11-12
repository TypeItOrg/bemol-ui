import { render, screen, within } from "@testing-library/react";

import { AuditEventDetail } from "@features/platform-audit/components/audit-event-detail";
import type { AuditEvent } from "@features/platform-audit/types/audit-event.types";

it.each([
  { action: "PASSKEY_CREATED", title: "Llave de acceso registrada", before: {}, after: { label: "Equipo personal" } },
  {
    action: "PASSKEY_UPDATED",
    title: "Llave de acceso renombrada",
    before: { label: "Equipo anterior" },
    after: { label: "Equipo personal" },
  },
  { action: "PASSKEY_DELETED", title: "Llave de acceso revocada", before: { active: true }, after: { active: false } },
])("muestra los nombres registrados para $title y separa los encabezados de ambas tarjetas", ({ action, title, before, after }) => {
  const event: AuditEvent = {
    id: "evento-llave",
    actorKind: "PLATFORM",
    actorId: "cuenta",
    actorName: "Administradora",
    subjectPersonId: null,
    subjectName: null,
    institutionId: null,
    institutionName: null,
    action,
    actionLabel: title,
    entityType: "PASSKEY",
    entityLabel: "Llave de acceso",
    entityId: "llave",
    actedOnBehalf: false,
    requestId: null,
    origin: "SELF_SERVICE",
    occurredAt: "2026-11-03T12:00:00Z",
    details: {
      fieldLabels: { label: "Nombre de la llave de acceso", active: "Estado" },
      entityName: "Equipo personal",
      changedFields: [action === "PASSKEY_DELETED" ? "active" : "label"],
      before,
      after,
    },
  };
  const props = { returnTo: "/audit-events" };
  const { container, rerender } = render(<AuditEventDetail event={event} {...props} />);

  expect(screen.getByText(title)).toBeInTheDocument();
  expect(screen.getByText("Llave de acceso")).toBeInTheDocument();
  const table = screen.getByRole("table", { name: "Cambios" });
  expect(within(table).getByText(action === "PASSKEY_DELETED" ? "Estado" : "Nombre de la llave de acceso")).toBeInTheDocument();
  expect(within(table).getByText(action === "PASSKEY_DELETED" ? "Activo" : (before.label ?? "Sin estado registrado"))).toBeInTheDocument();
  expect(within(table).getByText(action === "PASSKEY_DELETED" ? "Inactivo" : (after.label ?? "Sin estado registrado"))).toBeInTheDocument();

  for (const title of ["Datos del evento", "Cambios"]) {
    expect(screen.getByRole("heading", { name: title }).closest("header")).toHaveClass("border-b");
  }

  expect(container.textContent).not.toMatch(/passkey/i);

  rerender(
    <AuditEventDetail
      event={{ ...event, details: { fieldLabels: { label: "Nombre de la llave de acceso" }, changedFields: ["label"] } }}
      {...props}
    />,
  );
  expect(screen.queryByText("Equipo anterior")).not.toBeInTheDocument();
  expect(screen.queryByText("Equipo personal")).not.toBeInTheDocument();
  expect(within(screen.getByRole("table", { name: "Cambios" })).getAllByText("No registrado")).toHaveLength(2);
});

it("integra snapshots con horarios de 24 horas, fechas, nulos y campos privados sin secciones vacías", () => {
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
    actionLabel: "Turno actualizado",
    module: "SHIFTS",
    moduleLabel: "Turnos",
    entityType: "SHIFT",
    entityLabel: "Turno",
    entityId: "entidad-tecnica",
    actedOnBehalf: false,
    requestId: null,
    origin: "PLATFORM_ADMINISTRATION",
    occurredAt: "2026-10-18T21:00:00Z",
    details: {
      fieldLabels: {
        name: "Nombre",
        startTime: "Hora de inicio",
        active: "Activo",
        allowedFormats: "Formatos permitidos",
        dayOfWeek: "Día",
        startDate: "Desde",
        description: "Descripción",
        year: "Año",
        optional: "Opcional",
      },
      changedFields: ["name", "startTime", "active", "allowedFormats", "dayOfWeek", "startDate", "description", "year", "optional"],
      before: {
        name: "Mañana",
        startTime: "13:00:00",
        active: true,
        allowedFormats: ["application/pdf"],
        dayOfWeek: { code: "MONDAY", label: "Lunes" },
        startDate: null,
        year: 2025,
      },
      after: {
        name: "Matutino",
        startTime: "14:30:00",
        active: false,
        allowedFormats: [],
        dayOfWeek: { code: "TUESDAY", label: "Martes" },
        startDate: { type: "DATETIME", value: "2026-10-18T22:45:30Z" },
        year: 2026,
        optional: null,
      },
    },
  };
  const props = { returnTo: "/audit-events?page=2" };
  const { rerender, container } = render(<AuditEventDetail event={event} {...props} />);
  expect(screen.getByRole("heading", { name: "Datos del evento" })).toBeInTheDocument();
  expect(screen.getByText("Turno actualizado")).toBeInTheDocument();
  expect(screen.getByText("Fecha y hora")).toBeInTheDocument();
  const table = screen.getByRole("table", { name: "Cambios" });
  expect(
    within(table)
      .getAllByRole("columnheader")
      .map((column) => column.textContent),
  ).toEqual(["Campo", "Valor anterior", "Valor nuevo"]);

  for (const text of ["Mañana", "Matutino", "13:00:00", "14:30:00", "Lunes", "Martes", "application/pdf", "Ninguno", "2025"]) {
    expect(within(table).getByText(text)).toBeInTheDocument();
  }

  expect(screen.getByText(/19:45:30/)).toBeInTheDocument();
  expect(within(screen.getByText("Descripción").closest("tr")!).getAllByText("No registrado")).toHaveLength(2);
  expect(within(screen.getByText("Opcional").closest("tr")!).getByText("Sin estado registrado")).toBeInTheDocument();
  expect(within(screen.getByText("Opcional").closest("tr")!).getByText("Sin especificar")).toBeInTheDocument();
  expect(screen.getAllByRole("table")).toHaveLength(1);
  expect(screen.getByRole("link", { name: "Volver" })).toHaveAttribute("href", props.returnTo);
  expect(container.textContent).not.toMatch(/evento-tecnico|entidad-tecnica|a\.\s?m\.|p\.\s?m\./i);
  rerender(<AuditEventDetail event={{ ...event, details: {} }} {...props} />);
  expect(screen.queryByRole("heading", { name: "Cambios" })).not.toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  rerender(
    <AuditEventDetail
      event={{ ...event, details: { fieldLabels: { name: "Nombre" }, before: { name: "Turno anterior" }, after: { name: "Turno nuevo" } } }}
      {...props}
    />,
  );
  expect(screen.getByText("Turno anterior")).toBeInTheDocument();
  expect(screen.getByText("Turno nuevo")).toBeInTheDocument();
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
    actionLabel: "Roles de persona modificados",
    module: "ROLES",
    moduleLabel: "Roles",
    entityType: "PERSON",
    entityLabel: "Persona",
    entityId: "persona-tecnica",
    actedOnBehalf: false,
    requestId: "peticion-tecnica",
    origin: "PLATFORM_ADMINISTRATION",
    occurredAt: "2026-10-18T21:00:00Z",
    details: {
      fieldLabels: { roles: "Roles y alcances" },
      before: {
        roles: [
          {
            fieldLabels: { roleName: "Rol", accessScopeName: "Alcance", trainingPathCount: "Trayectos seleccionados" },
            roleId: "rol-anterior",
            roleName: "Coordinación anterior",
            accessScopeName: "Trayectos seleccionados",
            trainingPathCount: 1,
            trainingPathIds: ["trayecto-anterior"],
            password: "VALOR_PRIVADO",
          },
        ],
      },
      after: {
        roles: [
          {
            fieldLabels: { roleName: "Rol", accessScopeName: "Alcance" },
            roleId: "rol-nuevo",
            roleName: "Coordinación actual",
            accessScopeName: "Toda la institución",
            trainingPathIds: [],
          },
        ],
      },
    },
  };
  const props = {
    returnTo: "/audit-events",
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
        details: {
          fieldLabels: { name: "Nombre", permissions: "Permisos efectivos" },
          before: { name: "Rol anterior", permissions: [{ code: "COURSE_READ", label: "Ver cursos" }] },
          after: { name: "Rol actual", permissions: [{ code: "COURSE_WRITE", label: "Editar cursos" }] },
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
          fieldLabels: { requirements: "Asignaciones documentales" },
          before: { requirements: [] },
          after: {
            requirements: [
              {
                fieldLabels: { trainingPathName: "Trayecto formativo", level: "Nivel", displayOrder: "Orden", active: "Estado" },
                trainingPathName: "Trayecto musical",
                level: { code: "BEFORE_CONFIRMATION", label: "Obligatorio para confirmar" },
                displayOrder: 2,
                active: true,
                storagePath: "VALOR_PRIVADO",
              },
            ],
          },
        },
      }}
      {...props}
    />,
  );
  table = screen.getByRole("table", { name: "Cambios" });
  expect(within(table).getByText("Asignaciones documentales")).toBeInTheDocument();
  expect(within(table).getByText("Ninguno")).toBeInTheDocument();
  expect(within(table).getByText("Trayecto musical")).toBeInTheDocument();
  expect(within(table).getByText("Obligatorio para confirmar")).toBeInTheDocument();
  expect(within(table).getByText("Orden")).toBeInTheDocument();
  expect(container.textContent).not.toContain("VALOR_PRIVADO");

  rerender(
    <AuditEventDetail
      event={{
        ...event,
        action: "INSTITUTIONAL_ACCOUNT_CREATED",
        details: {
          fieldLabels: { initialRole: "Rol inicial", hasAccount: "Cuenta asociada" },
          after: { initialRole: { code: "APPLICANT", label: "Postulante" }, hasAccount: true },
        },
      }}
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
    <AuditEventDetail
      event={{
        ...event,
        action: "INSTITUTIONAL_ACCESS_CHANGED",
        details: { fieldLabels: { enabled: "Acceso" }, before: { enabled: true }, after: { enabled: false } },
      }}
      {...props}
    />,
  );
  table = screen.getByRole("table", { name: "Cambios" });
  expect(within(table).getByText("Acceso")).toBeInTheDocument();
  expect(within(table).getByText("Sí")).toBeInTheDocument();
  expect(within(table).getByText("No")).toBeInTheDocument();

  rerender(
    <AuditEventDetail
      event={{ ...event, action: "PERSON_UPDATED", details: { fieldLabels: { firstName: "Nombre" }, changedFields: ["firstName"] } }}
      {...props}
    />,
  );
  table = screen.getByRole("table", { name: "Cambios" });
  expect(within(table).getByText("Nombre")).toBeInTheDocument();
  expect(within(table).getAllByText("No registrado")).toHaveLength(2);

  rerender(
    <AuditEventDetail
      event={{
        ...event,
        action: "PERSON_UPDATED",
        details: {
          fieldLabels: { firstName: "Nombre", phoneNumber: "Teléfono", nationalityCountry: "Nacionalidad" },
          changedFields: ["firstName", "phoneNumber", "nationalityCountry"],
          before: { firstName: "Ana", phoneNumber: "3515551212", nationalityCountry: "Argentina" },
          after: { firstName: "Ana María", phoneNumber: "3515553434", nationalityCountry: "Chile" },
        },
      }}
      {...props}
    />,
  );
  table = screen.getByRole("table", { name: "Cambios" });
  expect(within(table).getByText("Nombre")).toBeInTheDocument();
  expect(within(table).getByText("Teléfono")).toBeInTheDocument();
  expect(within(table).getByText("Nacionalidad")).toBeInTheDocument();
  expect(within(table).getByText("Ana")).toBeInTheDocument();
  expect(within(table).getByText("Ana María")).toBeInTheDocument();
  expect(within(table).getByText("Argentina")).toBeInTheDocument();
  expect(within(table).getByText("Chile")).toBeInTheDocument();

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
        actionLabel: "Correo enviado",
        module: "EMAILS",
        moduleLabel: "Correos",
        entityType: "EMAIL",
        entityLabel: "Correo",
        details: { mailType: "Recuperación de contraseña", recipient: "qa@example.test" },
      }}
      {...props}
    />,
  );
  expect(screen.getByRole("heading", { name: "Datos del correo" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Cambios" })).not.toBeInTheDocument();
  expect(screen.getByText("qa@example.test")).toBeInTheDocument();
});

it("compara snapshots de clases sin cruzar cupos ni horarios ni modificar los datos", () => {
  const courseClass = (number: number, capacity: number, start: string, end: string) => ({
    fieldLabels: { classNumber: "Clase", teachers: "Docentes", days: "Días" },
    classNumber: number,
    teachers: [{ fieldLabels: { personId: "Docente" }, personId: "Docente QA" }],
    days: [
      {
        fieldLabels: { dayOfWeek: "Día", capacity: "Cupo", schedules: "Horarios" },
        dayOfWeek: "Lunes",
        capacity,
        schedules: [{ fieldLabels: { startTime: "Desde", endTime: "Hasta" }, startTime: start, endTime: end }],
      },
    ],
  });
  const before = [courseClass(1, 20, "09:00:00", "10:00:00"), courseClass(2, 5, "14:00:00", "15:00:00")];
  const after = [courseClass(1, 25, "10:30:00", "11:30:00"), courseClass(2, 8, "15:00:00", "16:00:00")];
  const event: AuditEvent = {
    id: "evento-curso",
    actorKind: "PLATFORM",
    actorId: "actor-qa",
    actorName: "Administradora QA",
    subjectPersonId: null,
    subjectName: null,
    institutionId: null,
    institutionName: null,
    action: "COURSE_CLASSES_CHANGED",
    actionLabel: "Clases de curso actualizadas",
    module: "COURSES",
    moduleLabel: "Cursos",
    entityType: "COURSE",
    entityLabel: "Curso",
    entityId: "curso-qa",
    actedOnBehalf: false,
    requestId: "peticion-qa",
    origin: "PLATFORM_ADMINISTRATION",
    occurredAt: "2026-10-18T22:18:38Z",
    details: { fieldLabels: { classes: "Clases del curso" }, changedFields: ["classes"], before: { classes: before }, after: { classes: after } },
  };
  const props = { returnTo: "/audit-events" };
  const preserved = JSON.stringify(event.details);
  const { rerender, container } = render(<AuditEventDetail event={event} {...props} />);
  const cells = within(screen.getByRole("table", { name: "Cambios" })).getAllByRole("cell");

  for (const text of ["20", "5", "09:00:00", "14:00:00"]) {
    expect(within(cells[0]).getByText(text)).toBeInTheDocument();
    expect(within(cells[1]).queryByText(text)).not.toBeInTheDocument();
  }

  for (const text of ["25", "8", "10:30:00", "16:00:00"]) {
    expect(within(cells[1]).getByText(text)).toBeInTheDocument();
    expect(within(cells[0]).queryByText(text)).not.toBeInTheDocument();
  }

  const previousClasses = within(cells[0]).getAllByText("Clase");
  expect(previousClasses[0].parentElement?.textContent).toBe("Clase1");
  expect(previousClasses[1].parentElement?.textContent).toBe("Clase2");
  expect(screen.getAllByRole("table")).toHaveLength(1);
  expect(container.textContent).not.toMatch(/peticion-qa|curso-qa|Creación|Eliminación/);
  expect(JSON.stringify(event.details)).toBe(preserved);
  rerender(<AuditEventDetail {...props} event={{ ...event, details: { ...event.details, changedFields: [], after: { classes: before } } }} />);
  expect(screen.queryByRole("table", { name: "Cambios" })).not.toBeInTheDocument();
  rerender(
    <AuditEventDetail {...props} event={{ ...event, details: { fieldLabels: { classes: "Clases del curso" }, after: { classes: after } } }} />,
  );
  expect(within(screen.getByRole("table", { name: "Cambios" })).getByText("Sin estado registrado")).toBeInTheDocument();
});

it("presenta el rol inicial etiquetado de la entidad junto al contexto de alta", () => {
  const event: AuditEvent = {
    id: "alta",
    actorKind: "PLATFORM",
    actorId: "actor",
    actorName: "Administradora",
    subjectPersonId: null,
    subjectName: null,
    institutionId: null,
    institutionName: null,
    action: "PERSON_CREATED",
    actionLabel: "Persona creada",
    entityType: "PERSON",
    entityLabel: "Persona",
    entityId: "persona",
    actedOnBehalf: false,
    requestId: null,
    origin: "PLATFORM_ADMINISTRATION",
    occurredAt: "2026-11-11T12:00:00Z",
    details: {
      fieldLabels: {
        firstName: "Nombre",
        initialRole: "Rol inicial",
        emailVerificationRequired: "Requiere verificación de correo",
        emailVerificationStatus: "Verificación de correo al crear la cuenta",
        personCreated: "Persona creada en esta operación",
      },
      before: {},
      after: {
        firstName: "Ana",
        initialRole: { code: "APPLICANT", label: "Postulante" },
        emailVerificationRequired: true,
        emailVerificationStatus: { code: "PENDING", label: "Pendiente" },
        personCreated: true,
      },
    },
  };
  render(<AuditEventDetail event={event} returnTo="/audit-events" />);
  expect(screen.getByText("Ana")).toBeInTheDocument();
  expect(screen.getByText("Postulante")).toBeInTheDocument();
  expect(screen.queryByText("APPLICANT")).not.toBeInTheDocument();
  expect(screen.getByText("Requiere verificación de correo")).toBeInTheDocument();
  expect(screen.getByText("Pendiente")).toBeInTheDocument();
  expect(screen.getAllByText("Rol inicial")).toHaveLength(1);
});

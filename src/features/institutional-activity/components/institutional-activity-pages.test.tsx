import { render, screen } from "@testing-library/react";

import { InstitutionalActivityDetail } from "@features/institutional-activity/components/institutional-activity-detail";
import { InstitutionalActivityPage } from "@features/institutional-activity/components/institutional-activity-page";
import {
  fetchInstitutionalActivity,
  fetchInstitutionalActivityEvent,
} from "@features/institutional-activity/services/institutional-activity.service";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { INSTITUTIONAL_PERMISSION } from "@features/institutional-auth/types/institutional-permission.types";
import type { InstitutionalUser } from "@features/institutional-auth/types/institutional-user.types";
import type { AuditEvent } from "@features/platform-audit/types/audit-event.types";

jest.mock("@features/institutional-auth/services/get-institutional-user.service", () => ({ requireInstitutionalUser: jest.fn() }));
jest.mock("@features/institutional-activity/services/institutional-activity.service", () => ({
  fetchInstitutionalActivity: jest.fn(),
  fetchInstitutionalActivityEvent: jest.fn(),
  fetchInstitutionalActivityLabels: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => "/emails/019a1234-1234-7123-8123-123456789abc",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

const id = "019a1234-1234-7123-8123-123456789abc";
const baseUser: InstitutionalUser = {
  userId: "user",
  institutionId: "institution",
  name: "Ana",
  lastName: "Pérez",
  documentNumber: "12345678",
  capabilities: {
    canViewOwnEnrollmentApplications: false,
    canManageOwnEnrollmentApplications: false,
    canViewOwnFormation: false,
    canViewTeaching: false,
    canUpdateTeachingAcademicStatus: false,
  },
  systemRoleCodes: [] as const,
  roles: [],
  permissions: [],
};
const event: AuditEvent = {
  id,
  actorKind: "INSTITUTION",
  actorId: "actor",
  actorName: "Ana Pérez",
  subjectPersonId: null,
  subjectName: null,
  institutionId: "institution",
  institutionName: "Conservatorio",
  action: "EMAIL_SENT",
  entityType: "EMAIL",
  entityId: "email",
  actedOnBehalf: false,
  requestId: null,
  origin: null,
  details: { mailType: "Verificación de correo", recipient: "ana@example.test" },
  occurredAt: "2026-10-26T12:00:00Z",
  history: null,
};

it.each([
  [false, INSTITUTIONAL_PERMISSION.EMAIL_READ],
  [true, INSTITUTIONAL_PERMISSION.AUDIT_READ],
])("blocks the list and detail without their own permission, mailView=%s", async (mailView, otherPermission) => {
  jest.mocked(requireInstitutionalUser).mockResolvedValue({ ...baseUser, permissions: [otherPermission] });

  const list = await InstitutionalActivityPage({ params: {}, mailView });
  const detail = await InstitutionalActivityDetail({ eventId: id, mailView });

  const { unmount } = render(list);
  expect(screen.getByText("Sin acceso")).toBeVisible();
  unmount();
  render(detail);
  expect(screen.getByText("Sin acceso")).toBeVisible();
  expect(fetchInstitutionalActivity).not.toHaveBeenCalled();
  expect(fetchInstitutionalActivityEvent).not.toHaveBeenCalled();
});

it("shows date validation before fetching the institutional list", async () => {
  jest.mocked(requireInstitutionalUser).mockResolvedValue({ ...baseUser, permissions: [INSTITUTIONAL_PERMISSION.AUDIT_READ] });

  render(await InstitutionalActivityPage({ params: { from: "2026-10-26", to: "2026-10-01" }, mailView: false }));

  expect(screen.getByRole("alert")).toHaveTextContent("La fecha desde no puede ser posterior a la fecha hasta.");
  expect(fetchInstitutionalActivity).not.toHaveBeenCalled();
});

it("loads mail detail in the current institution and rejects an external return path", async () => {
  jest.mocked(requireInstitutionalUser).mockResolvedValue({ ...baseUser, permissions: [INSTITUTIONAL_PERMISSION.EMAIL_READ] });
  jest.mocked(fetchInstitutionalActivityEvent).mockResolvedValue(event);

  render(await InstitutionalActivityDetail({ eventId: id, returnTo: "//other.example/", mailView: true }));

  expect(fetchInstitutionalActivityEvent).toHaveBeenCalledWith("institution", id, true);
  expect(screen.getByText("ana@example.test")).toBeVisible();
  expect(screen.getByRole("link", { name: "Volver" })).toHaveAttribute("href", "/emails");
});

it("returns not found for a missing event", async () => {
  jest.mocked(requireInstitutionalUser).mockResolvedValue({ ...baseUser, permissions: [INSTITUTIONAL_PERMISSION.EMAIL_READ] });
  jest.mocked(fetchInstitutionalActivityEvent).mockResolvedValue(null);

  await expect(InstitutionalActivityDetail({ eventId: id, mailView: true })).rejects.toThrow("NOT_FOUND");
});

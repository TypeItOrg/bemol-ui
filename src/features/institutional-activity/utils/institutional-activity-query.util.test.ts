import { getAcademicSidebarNavigationSections } from "@features/academic/utils/academic-sidebar-navigation.util";
import { getInstitutionalActivityHomeLinks } from "@features/institutional-activity/utils/institutional-activity-access.util";
import { parseInstitutionalActivityFilters } from "@features/institutional-activity/utils/institutional-activity-query.util";
import { INSTITUTIONAL_PERMISSION } from "@features/institutional-auth/types/institutional-permission.types";
import type { InstitutionalUser } from "@features/institutional-auth/types/institutional-user.types";
import { getInstitutionalNavigationSections } from "@features/institutional-auth/utils/institutional-navigation.util";
import { buildAuditApiParams } from "@features/platform-audit/utils/audit-query.util";

it("does not forward platform, institution or technical filters from the URL", () => {
  const filters = parseInstitutionalActivityFilters(
    {
      scope: "PLATFORM",
      institutionId: "019a1234-1234-7123-8123-123456789abc",
      requestId: "private-request",
      actorKind: "PLATFORM",
      actorId: "019a1234-1234-7123-8123-123456789abc",
      search: "curso",
      module: "COURSES",
      page: "2",
      size: "20",
    },
    false,
  );

  const query = buildAuditApiParams(filters);

  expect(query.get("module")).toBe("COURSES");
  expect(query.get("search")).toBe("curso");
  expect(query.get("page")).toBe("2");

  for (const key of ["scope", "institutionId", "requestId", "actorKind", "actorId"]) {
    expect(query.has(key)).toBe(false);
  }
});

it("keeps mail and audit filters separate, including a tampered module", () => {
  expect(parseInstitutionalActivityFilters({ module: "EMAILS", action: "EMAIL_SENT" }, false)).toMatchObject({
    module: undefined,
    action: undefined,
  });
  expect(parseInstitutionalActivityFilters({ module: "USERS", action: "EMAIL_FAILED" }, true)).toMatchObject({
    module: "EMAILS",
    action: "EMAIL_FAILED",
  });
  expect(parseInstitutionalActivityFilters({ from: "2026-10-26", to: "2026-10-01" }, false).dateError).toBeDefined();
});

it.each([
  [[], []],
  [[INSTITUTIONAL_PERMISSION.AUDIT_READ], ["/audit-events"]],
  [[INSTITUTIONAL_PERMISSION.EMAIL_READ], ["/emails"]],
  [
    [INSTITUTIONAL_PERMISSION.AUDIT_READ, INSTITUTIONAL_PERMISSION.EMAIL_READ],
    ["/audit-events", "/emails"],
  ],
])("shows only independently authorized activity links for %j", (permissions, paths) => {
  const user: InstitutionalUser = {
    userId: "user",
    institutionId: "institution",
    name: "Ana",
    lastName: "Pérez",
    documentNumber: "12345678",
    roles: [],
    permissions,
  };

  expect(getInstitutionalActivityHomeLinks(user).map((link) => link.href)).toEqual(paths);

  const sections = getAcademicSidebarNavigationSections(getInstitutionalNavigationSections(user), "institutional");

  const group = sections.flatMap((section) => section.items).find((item) => "id" in item && item.id === "institutional-activity");

  if (paths.length === 0) {
    expect(group).toBeUndefined();
  } else {
    expect(group).toMatchObject({ title: "Actividad", items: paths.map((url) => expect.objectContaining({ url })) });
  }
});

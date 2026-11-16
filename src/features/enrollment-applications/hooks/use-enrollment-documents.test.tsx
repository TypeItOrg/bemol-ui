import { act, renderHook } from "@testing-library/react";

import { useEnrollmentDocuments } from "@features/enrollment-applications/hooks/use-enrollment-documents";
import type { EnrollmentApplicationResponse } from "@features/enrollment-applications/types/enrollment-application-response.types";

const refresh = jest.fn();

jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
jest.mock("@features/guardian-workspace/components/guardian-workspace-provider", () => ({ useOperatingPersonId: () => undefined }));

const APPLICATION = {
  applicationId: "application-a",
  institutionId: "institution-a",
  personId: "person-a",
  academicYearId: "year-a",
  enrollmentPeriodId: "period-a",
  status: "DRAFT",
  isEditable: true,
  data: {},
  documents: [],
  createdAt: "2026-03-01T10:00:00Z",
  updatedAt: "2026-03-01T10:00:00Z",
} as EnrollmentApplicationResponse;

describe("useEnrollmentDocuments", () => {
  beforeEach(() => {
    refresh.mockClear();
    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } }));
  });

  it("keeps the draft wizard in place after saving a document", async () => {
    const { result } = renderHook(() => useEnrollmentDocuments({ application: APPLICATION, autoSave: true }));

    await act(() => result.current.refresh());

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("refreshes server-rendered views outside the draft wizard", async () => {
    const { result } = renderHook(() => useEnrollmentDocuments({ application: APPLICATION }));

    await act(() => result.current.refresh());

    expect(refresh).toHaveBeenCalledTimes(1);
  });
});

import type { EnrollmentApplicationResponse } from "@features/enrollment-applications/types/enrollment-application-response.types";

jest.mock("@features/institutional-auth/services/get-institutional-user.service", () => ({
  requireInstitutionalUser: jest.fn(async () => ({
    institutionId: "00000000-0000-4000-8000-000000000001",
    personId: "00000000-0000-4000-8000-000000000003",
  })),
}));

const INSTITUTION_ID = "00000000-0000-4000-8000-000000000001";
const PERSON_ID = "00000000-0000-4000-8000-000000000003";
const SELF_SERVICE_API_PATH = `/api/v1/institutions/${INSTITUTION_ID}/self-service/${PERSON_ID}/enrollment-applications`;

const MOCK_APPLICATION: EnrollmentApplicationResponse = {
  applicationId: "app-456",
  institutionId: INSTITUTION_ID,
  personId: PERSON_ID,
  studyPlanId: "plan-1",
  academicYearId: "year-1",
  enrollmentPeriodId: "period-1",
  status: "SUBMITTED",
  isEditable: false,
  data: {},
  createdAt: "2026-03-01T10:00:00Z",
  updatedAt: "2026-03-01T10:00:00Z",
};

describe("enrollment-application.service self-service queries", () => {
  const institutionalApiFetchMock = jest.fn<Promise<Response>, [string, RequestInit?]>();

  async function importService() {
    jest.doMock("@features/institutional-auth/services/institutional-api-fetch.service", () => ({
      institutionalApiFetch: institutionalApiFetchMock,
    }));

    return import("@features/enrollment-applications/services/enrollment-application.service");
  }

  beforeEach(() => {
    jest.resetModules();
    institutionalApiFetchMock.mockReset();
  });

  describe("fetchEnrollmentApplicationById", () => {
    it("scopes the application read to the explicitly selected person", async () => {
      const personId = "00000000-0000-4000-8000-000000000007";
      institutionalApiFetchMock.mockResolvedValue(Response.json({ ...MOCK_APPLICATION, personId }));
      const { fetchEnrollmentApplicationById } = await importService();

      const result = await fetchEnrollmentApplicationById("app-456", personId);

      expect(institutionalApiFetchMock).toHaveBeenCalledWith(
        `/api/v1/institutions/${INSTITUTION_ID}/self-service/${personId}/enrollment-applications/app-456`,
        { method: "GET" },
      );
      expect(result.personId).toBe(personId);
    });

    it("rejects an invalid selected person before making a backend request", async () => {
      const { fetchEnrollmentApplicationById } = await importService();

      await expect(fetchEnrollmentApplicationById("app-456", "invalid-person")).rejects.toThrow("La persona seleccionada no es válida.");
      expect(institutionalApiFetchMock).not.toHaveBeenCalled();
    });
  });

  describe("submitEnrollmentApplication", () => {
    it("returns the parsed response when the backend confirms submission", async () => {
      institutionalApiFetchMock.mockResolvedValue(Response.json(MOCK_APPLICATION));
      const { submitEnrollmentApplication } = await importService();

      const result = await submitEnrollmentApplication("app-456");

      expect(institutionalApiFetchMock).toHaveBeenCalledWith(`${SELF_SERVICE_API_PATH}/app-456/submit`, { method: "POST" });
      expect(result).toEqual(MOCK_APPLICATION);
    });

    it("propagates the error instead of fabricating a submitted response on 404", async () => {
      institutionalApiFetchMock.mockResolvedValue(new Response(JSON.stringify({ message: "No encontrada" }), { status: 404 }));
      const { submitEnrollmentApplication } = await importService();

      await expect(submitEnrollmentApplication("app-456")).rejects.toThrow("No encontrada");
    });

    it("propagates the error instead of fabricating a submitted response on 405", async () => {
      institutionalApiFetchMock.mockResolvedValue(new Response(JSON.stringify({ message: "Método no permitido" }), { status: 405 }));
      const { submitEnrollmentApplication } = await importService();

      await expect(submitEnrollmentApplication("app-456")).rejects.toThrow("Método no permitido");
    });

    it("propagates the error on a server failure", async () => {
      institutionalApiFetchMock.mockResolvedValue(new Response(JSON.stringify({ message: "Error del servidor" }), { status: 500 }));
      const { submitEnrollmentApplication } = await importService();

      await expect(submitEnrollmentApplication("app-456")).rejects.toThrow("Error del servidor");
    });
  });

  describe("cancelEnrollmentApplication", () => {
    it("returns the parsed response when the backend confirms cancellation", async () => {
      institutionalApiFetchMock.mockResolvedValue(Response.json(MOCK_APPLICATION));
      const { cancelEnrollmentApplication } = await importService();

      const result = await cancelEnrollmentApplication("app-456");

      expect(institutionalApiFetchMock).toHaveBeenCalledWith(`${SELF_SERVICE_API_PATH}/app-456/cancel`, { method: "POST" });
      expect(result).toEqual(MOCK_APPLICATION);
    });

    it("propagates the error instead of fabricating a cancelled response on 404", async () => {
      institutionalApiFetchMock.mockResolvedValue(new Response(JSON.stringify({ message: "No encontrada" }), { status: 404 }));
      const { cancelEnrollmentApplication } = await importService();

      await expect(cancelEnrollmentApplication("app-456")).rejects.toThrow("No encontrada");
    });

    it("propagates the error instead of fabricating a cancelled response on 405", async () => {
      institutionalApiFetchMock.mockResolvedValue(new Response(JSON.stringify({ message: "Método no permitido" }), { status: 405 }));
      const { cancelEnrollmentApplication } = await importService();

      await expect(cancelEnrollmentApplication("app-456")).rejects.toThrow("Método no permitido");
    });
  });
});

describe("enrollment-application.service institutional queries", () => {
  const enrollmentApplicationApiFetchMock = jest.fn<Promise<Response>, [string, RequestInit?]>();

  async function importInstitutionalService() {
    jest.doMock("@features/institutional-auth/services/institutional-api-fetch.service", () => ({
      institutionalApiFetch: enrollmentApplicationApiFetchMock,
    }));

    return import("@features/enrollment-applications/services/enrollment-application.service");
  }

  beforeEach(() => {
    jest.resetModules();
    enrollmentApplicationApiFetchMock.mockReset();
  });

  it("preserves the dependent filter on the self-service list when provided", async () => {
    enrollmentApplicationApiFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ items: [], page: 0, size: 10, totalItems: 0, totalPages: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const service = await importInstitutionalService();
    await service.fetchMyEnrollmentApplications(INSTITUTION_ID, { page: 0, size: 10, dependentPersonId: "dependent-1" });

    const [path] = enrollmentApplicationApiFetchMock.mock.calls[0];
    expect(path).toBe(`${SELF_SERVICE_API_PATH}?page=0&size=10&sort=createdAt%2Cdesc&dependentPersonId=dependent-1`);
  });
});

import { proxyInstitutionalGradeGet } from "@features/course-enrollments/utils/grade-route-proxy.util";
import { getInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";

jest.mock("@features/institutional-auth/services/get-institutional-user.service", () => ({
  getInstitutionalUser: jest.fn(),
}));

jest.mock("@features/institutional-auth/services/institutional-api-fetch.service", () => ({
  institutionalApiFetch: jest.fn(),
}));

const VALID_UUID = "00000000-0000-4000-8000-000000000001";
const INSTITUTION_ID = "00000000-0000-4000-8000-000000000099";

describe("proxyInstitutionalGradeGet", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns 400 when any UUID parameter is invalid", async () => {
    const request = new Request("http://localhost:3000/api/institutional/course-enrollments/not-a-uuid/grades");

    const response = await proxyInstitutionalGradeGet(
      request,
      (institutionId) => `/api/v1/institutions/${institutionId}/course-enrollments/not-a-uuid/grades`,
      { uuids: ["not-a-uuid"] },
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(getInstitutionalUser).not.toHaveBeenCalled();
  });

  it("returns 401 JSON when there is no authenticated institutional session", async () => {
    jest.mocked(getInstitutionalUser).mockResolvedValue(null);
    const request = new Request(`http://localhost:3000/api/institutional/course-enrollments/${VALID_UUID}/grades`);

    const response = await proxyInstitutionalGradeGet(
      request,
      (institutionId) => `/api/v1/institutions/${institutionId}/course-enrollments/${VALID_UUID}/grades`,
      { uuids: [VALID_UUID] },
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("allowlists only numeric page and size params and forwards signal", async () => {
    jest.mocked(getInstitutionalUser).mockResolvedValue({ institutionId: INSTITUTION_ID } as never);
    jest.mocked(institutionalApiFetch).mockResolvedValue(new Response(JSON.stringify({ items: [] }), { status: 200 }));

    const request = new Request(
      `http://localhost:3000/api/institutional/course-enrollments/${VALID_UUID}/grades/${VALID_UUID}/history?page=1&size=20&sort=evil`,
    );

    const response = await proxyInstitutionalGradeGet(
      request,
      (institutionId) => `/api/v1/institutions/${institutionId}/course-enrollments/${VALID_UUID}/grades/${VALID_UUID}/history`,
      { uuids: [VALID_UUID, VALID_UUID], allowPaginationQuery: true },
    );

    expect(response.status).toBe(200);
    expect(institutionalApiFetch).toHaveBeenCalledWith(
      `/api/v1/institutions/${INSTITUTION_ID}/course-enrollments/${VALID_UUID}/grades/${VALID_UUID}/history?page=1&size=20`,
      { signal: request.signal },
    );
  });

  it("returns 503 JSON when upstream fetch fails", async () => {
    jest.mocked(getInstitutionalUser).mockResolvedValue({ institutionId: INSTITUTION_ID } as never);
    jest.mocked(institutionalApiFetch).mockRejectedValue(new Error("ECONNREFUSED"));

    const request = new Request(`http://localhost:3000/api/institutional/course-enrollments/${VALID_UUID}/grades`);

    const response = await proxyInstitutionalGradeGet(
      request,
      (institutionId) => `/api/v1/institutions/${institutionId}/course-enrollments/${VALID_UUID}/grades`,
      { uuids: [VALID_UUID] },
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});

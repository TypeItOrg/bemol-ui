import { revalidatePath } from "next/cache";

import { mutateEnrollmentFormAction } from "@features/enrollment-forms/actions/mutate-enrollment-form.action";
import { enrollmentFormAccess } from "@features/enrollment-forms/services/enrollment-form-access.service";
import { formDefinitionFixture, formTestId } from "@features/enrollment-forms/testing/enrollment-form.fixture";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";
import { platformApiFetch } from "@features/platform-auth/services/platform-api-fetch.service";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@features/enrollment-forms/services/enrollment-form-access.service", () => ({ enrollmentFormAccess: jest.fn() }));
jest.mock("@features/institutional-auth/services/institutional-api-fetch.service", () => ({ institutionalApiFetch: jest.fn() }));
jest.mock("@features/platform-auth/services/platform-api-fetch.service", () => ({ platformApiFetch: jest.fn() }));

beforeEach(() => {
  jest.mocked(enrollmentFormAccess).mockReset().mockResolvedValue(null);
  jest
    .mocked(platformApiFetch)
    .mockReset()
    .mockResolvedValue(Response.json({ revision: 4 }));
  jest
    .mocked(institutionalApiFetch)
    .mockReset()
    .mockResolvedValue(new Response(null, { status: 204 }));
});

it("validates every bound argument and definition before network I/O", async () => {
  const command = { kind: "publish", formId: formTestId(1), versionId: formTestId(2), expectedRevision: 0 };
  expect(await mutateEnrollmentFormAction("bad" as "platform", formTestId(3), command)).toHaveProperty("status", 400);
  expect(await mutateEnrollmentFormAction("platform", "invalid", command)).toHaveProperty("status", 400);
  expect(await mutateEnrollmentFormAction("platform", formTestId(3), { ...command, expectedRevision: "0" })).toHaveProperty("status", 400);
  expect(await mutateEnrollmentFormAction("platform", formTestId(3), { ...command, kind: "save", definition: {} })).toHaveProperty("status", 400);
  expect(platformApiFetch).not.toHaveBeenCalled();
  expect(enrollmentFormAccess).not.toHaveBeenCalled();
});

it("uses the platform transport and exact expected revision for a definition replacement", async () => {
  const definition = formDefinitionFixture();
  const result = await mutateEnrollmentFormAction("platform", formTestId(3), {
    kind: "save",
    formId: formTestId(1),
    versionId: formTestId(2),
    expectedRevision: 3,
    definition,
  });
  expect(result).toEqual({ success: true, data: { revision: 4 } });
  expect(platformApiFetch).toHaveBeenCalledWith(
    `/api/v1/admin/institutions/${formTestId(3)}/enrollment-forms/${formTestId(1)}/versions/${formTestId(2)}`,
    expect.objectContaining({ method: "PUT", body: JSON.stringify({ definition, expectedRevision: 3 }) }),
  );
  expect(institutionalApiFetch).not.toHaveBeenCalled();
});

it("requires update permission and never retries or invalidates on conflict", async () => {
  jest.mocked(enrollmentFormAccess).mockResolvedValueOnce(403);
  expect(await mutateEnrollmentFormAction("institutional", formTestId(3), { kind: "create", name: "Talleres" })).toHaveProperty("status", 403);
  expect(institutionalApiFetch).not.toHaveBeenCalled();
  jest.mocked(platformApiFetch).mockResolvedValue(Response.json({ message: "La versión cambió" }, { status: 409 }));
  expect(
    await mutateEnrollmentFormAction("platform", formTestId(3), {
      kind: "publish",
      formId: formTestId(1),
      versionId: formTestId(2),
      expectedRevision: 3,
    }),
  ).toEqual({ error: "La versión cambió", status: 409 });
  expect(platformApiFetch).toHaveBeenCalledTimes(1);
  expect(revalidatePath).not.toHaveBeenCalled();
});

it("sends a revision-bound delete and normalizes transport failure", async () => {
  expect(
    await mutateEnrollmentFormAction("institutional", formTestId(3), { kind: "unassign", assignmentId: formTestId(9), expectedRevision: 2 }),
  ).toEqual({ success: true, data: undefined });
  expect(institutionalApiFetch).toHaveBeenCalledWith(
    expect.stringContaining(`/${formTestId(9)}?expectedRevision=2`),
    expect.objectContaining({ method: "DELETE" }),
  );
  jest.mocked(platformApiFetch).mockRejectedValue(new Error("offline"));
  expect(await mutateEnrollmentFormAction("platform", formTestId(3), { kind: "create", name: "Talleres" })).toHaveProperty("error");
});

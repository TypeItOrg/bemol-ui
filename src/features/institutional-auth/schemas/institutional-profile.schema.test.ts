import { institutionalProfileSchema } from "@features/institutional-auth/schemas/institutional-profile.schema";

const validProfile = {
  firstName: "Matias",
  lastName: "Boero",
  birthDate: "1995-05-15",
  email: "matias@example.com",
  phoneNumber: "12345678",
};

describe("institutionalProfileSchema", () => {
  it("keeps ordinary contact fields and excludes protected identity fields", () => {
    expect(institutionalProfileSchema.parse(validProfile)).toEqual({ phoneNumber: "12345678" });
  });

  it("reports an invalid phone number", () => {
    expect(institutionalProfileSchema.safeParse({ ...validProfile, phoneNumber: "+54 123" })).toMatchObject({
      success: false,
      error: { issues: [expect.objectContaining({ path: ["phoneNumber"], message: "El teléfono solo admite números y guiones." })] },
    });
  });

  it("validates an incomplete address independently", () => {
    expect(institutionalProfileSchema.safeParse({ ...validProfile, address: { cityId: "", street: " " } })).toMatchObject({
      success: false,
      error: {
        issues: [
          expect.objectContaining({ path: ["address", "cityId"], message: "La ciudad es requerida." }),
          expect.objectContaining({ path: ["address", "street"], message: "La calle es requerida." }),
        ],
      },
    });
  });
});

import { createPersonFormSchema, updatePersonFormSchema } from "@features/people/schemas/person-form.schema";

const validPerson = {
  firstName: "Ana",
  lastName: "Pérez",
  documentNumber: "12345678",
  email: "ana@example.com",
  phoneNumber: "03534100000",
  nationalityCountryId: "11111111-1111-4111-8111-111111111111",
  birthDate: "2000-01-01",
  initialRole: "APPLICANT",
};

describe("person form schemas", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-09-14T15:00:00Z"));
  });

  afterEach(() => jest.useRealTimers());

  it.each(["3534123456", "353-4619146"])("accepts a supported phone number %s", (phoneNumber) => {
    expect(updatePersonFormSchema.parse({ ...validPerson, phoneNumber })).toMatchObject({ phoneNumber });
  });

  it.each([
    ["phoneNumber", "", "El teléfono es requerido."],
    ["nationalityCountryId", "", "Seleccioná una nacionalidad."],
    ["phoneNumber", "+54 353 4619146", "El teléfono solo admite números y guiones."],
    ["email", "", "El correo electrónico es requerido."],
    ["email", "   ", "El correo electrónico es requerido."],
    ["email", "not-an-email", "El correo electrónico es inválido."],
    ["documentNumber", "1234A678", "El documento debe tener exactamente 8 dígitos."],
    ["birthDate", "", "La fecha de nacimiento es requerida."],
    ["birthDate", "2023-09-15", "La persona debe tener al menos 3 años."],
  ])("rejects invalid %s (%s) for its own validation rule", (field, value, message) => {
    const result = createPersonFormSchema.safeParse({ ...validPerson, [field]: value });

    expect(result).toMatchObject({
      success: false,
      error: { issues: [expect.objectContaining({ path: [field], message })] },
    });
  });

  it("accepts the exact third birthday", () => {
    expect(createPersonFormSchema.parse({ ...validPerson, birthDate: "2023-09-14" })).toEqual({
      ...validPerson,
      birthDate: "2023-09-14",
    });
  });

  it.each(["APPLICANT", "REPRESENTATIVE"])("accepts the explicit initial role %s", (initialRole) => {
    expect(createPersonFormSchema.parse({ ...validPerson, initialRole }).initialRole).toBe(initialRole);
  });

  it.each([undefined, null, "", "STUDENT", "UNKNOWN"])("rejects missing or unsupported initial role %s", (initialRole) => {
    const result = createPersonFormSchema.safeParse({ ...validPerson, initialRole });

    expect(result).toMatchObject({
      success: false,
      error: { issues: [expect.objectContaining({ path: ["initialRole"], message: "Seleccioná un rol inicial." })] },
    });
  });

  it("never produces administrative credentials or a direct email change", () => {
    const input = { ...validPerson, password: "not-accepted", confirmPassword: "not-accepted" };
    expect(createPersonFormSchema.parse(input)).not.toHaveProperty("password");
    const update = updatePersonFormSchema.parse(input);
    expect(update).not.toHaveProperty("password");
    expect(update).not.toHaveProperty("confirmPassword");
    expect(update).not.toHaveProperty("email");
    expect(update).not.toHaveProperty("initialRole");
  });
});

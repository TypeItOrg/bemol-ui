import type { PersonFormInput } from "@features/people/types/person-form-input.types";
import { getDefaultValues, getFormData } from "@features/people/utils/person-form.util";

const VALUES: PersonFormInput = {
  firstName: "Ana",
  lastName: "Pérez",
  documentNumber: "12345678",
  email: "ana@example.com",
  phoneNumber: "",
  birthDate: "2000-01-01",
  initialRole: "REPRESENTATIVE",
};

describe("person form serialization", () => {
  it("does not preselect an initial role", () => {
    expect(getDefaultValues(undefined).initialRole).toBe("");
  });

  it.each(["APPLICANT", "REPRESENTATIVE"] as const)("serializes the selected initial role %s only on creation", (initialRole) => {
    expect(getFormData({ ...VALUES, initialRole }, false, true).get("initialRole")).toBe(initialRole);
    expect(getFormData({ ...VALUES, initialRole }, true, true).has("initialRole")).toBe(false);
    expect(getFormData({ ...VALUES, initialRole }, true, false).has("initialRole")).toBe(false);
  });
});

export type PersonFormInput = {
  firstName: string;
  lastName: string;
  documentNumber: string;
  email: string;
  phoneNumber: string;
  nationalityCountryId: string;
  birthDate: string;
  initialRole: "" | "APPLICANT" | "REPRESENTATIVE";
};

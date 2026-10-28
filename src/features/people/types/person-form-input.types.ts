export type PersonFormInput = {
  firstName: string;
  lastName: string;
  documentNumber: string;
  email: string;
  phoneNumber: string;
  birthDate: string;
  initialRole: "" | "APPLICANT" | "REPRESENTATIVE";
};

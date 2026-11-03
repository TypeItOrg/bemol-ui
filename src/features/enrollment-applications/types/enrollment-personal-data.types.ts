import type { Country } from "@features/locations/types/country.types";

export interface EnrollmentPersonalData {
  firstName: string;
  lastName: string;
  documentNumber: string;
  birthDate: string | null;
  phoneNumber: string;
  nationalityCountry: Country | null;
  email: string;
}

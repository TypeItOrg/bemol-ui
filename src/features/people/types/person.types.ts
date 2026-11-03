import type { Country } from "@features/locations/types/country.types";

export type Person = {
  nationalityCountry: Country | null;
  personId: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  birthDate: string | null;
  phoneNumber: string | null;
  email: string | null;
  institutionId: string;
  institutionName: string;
  deleted: boolean;
};

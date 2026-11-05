import type { ReactNode } from "react";

import { notFound, redirect } from "next/navigation";

import { render, screen } from "@testing-library/react";

import { fetchInstitutionalPerson } from "@features/institutional-auth/services/fetch-institutional-person.service";
import { fetchInstitutionalSessions } from "@features/institutional-auth/services/fetch-institutional-sessions.service";
import { fetchPasskeys } from "@features/institutional-auth/services/fetch-passkeys.service";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import type { InstitutionalPerson } from "@features/institutional-auth/types/institutional-person.types";
import type { InstitutionalUser } from "@features/institutional-auth/types/institutional-user.types";

import ProfilePage from "@app/(institutional)/account/profile/page";
import SecurityPage from "@app/(institutional)/account/security/page";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NOT_FOUND");
  }),
  redirect: jest.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
jest.mock("@common/components/ui/data-table-navigation", () => ({
  DataTableNavigationProvider: ({ children }: { children: ReactNode }) => children,
}));
jest.mock("@features/institutional-auth/components/institutional-profile", () => ({ InstitutionalProfile: jest.fn(() => null) }));
jest.mock("@features/institutional-auth/components/institutional-password-settings", () => ({
  InstitutionalPasswordSettings: () => <div data-testid="password-settings" />,
}));
jest.mock("@features/institutional-auth/components/passkey-manager", () => ({
  PasskeyManager: () => <div data-testid="passkey-manager" />,
}));
jest.mock("@features/institutional-auth/components/institutional-sessions-table-container", () => ({
  InstitutionalSessionsTableContainer: () => <div data-testid="sessions-table" />,
}));
jest.mock("@features/institutional-auth/services/fetch-institutional-person.service", () => ({ fetchInstitutionalPerson: jest.fn() }));
jest.mock("@features/institutional-auth/services/fetch-institutional-sessions.service", () => ({ fetchInstitutionalSessions: jest.fn() }));
jest.mock("@features/institutional-auth/services/fetch-passkeys.service", () => ({ fetchPasskeys: jest.fn() }));
jest.mock("@features/institutional-auth/services/get-institutional-user.service", () => ({ requireInstitutionalUser: jest.fn() }));
jest.mock("@features/institutional-auth/utils/institutional-metadata.util", () => ({ getInstitutionalMetadata: jest.fn() }));

const USER: InstitutionalUser = {
  userId: "user-1",
  personId: "person-1",
  institutionId: "institution-1",
  name: "Ana",
  lastName: "Pérez",
  documentNumber: "12345678",
  roles: [],
  systemRoleCodes: [],
  permissions: [],
  capabilities: {
    canViewOwnEnrollmentApplications: false,
    canManageOwnEnrollmentApplications: false,
    canViewOwnFormation: false,
    canViewTeaching: false,
    canUpdateTeachingAcademicStatus: false,
  },
};

const PERSON: InstitutionalPerson = {
  personId: USER.personId!,
  institutionId: USER.institutionId,
  institutionName: "Institución de prueba",
  firstName: USER.name,
  lastName: USER.lastName,
  documentNumber: USER.documentNumber,
  email: "ana@example.test",
  phoneNumber: null,
  birthDate: null,
  address: null,
  birthCity: null,
  nationalityCountry: null,
  deleted: false,
};

const RESTRICTED_IDENTITIES = [
  { ...USER, delegated: true },
  { ...USER, userId: null },
  { ...USER, userId: null, delegated: true },
];

beforeEach(() => {
  jest.mocked(requireInstitutionalUser).mockReset().mockResolvedValue(USER);
  jest.mocked(fetchInstitutionalPerson).mockReset().mockResolvedValue(PERSON);
  jest.mocked(fetchPasskeys).mockReset().mockResolvedValue({ passkeys: [], maxActivePasskeys: 10, activePasskeys: 0 });
  jest.mocked(fetchInstitutionalSessions).mockReset().mockResolvedValue({ items: [], page: 0, size: 20, totalItems: 0, totalPages: 0 });
});

describe("Institutional profile permissions", () => {
  it("allows email management only for the account holder", async () => {
    expect(await ProfilePage()).toMatchObject({ props: { person: PERSON, canManageEmail: true, canEditContactEmail: false } });
  });

  it.each(RESTRICTED_IDENTITIES)("keeps the profile visible without email management for restricted identities %#", async (user) => {
    jest.mocked(requireInstitutionalUser).mockResolvedValue(user);

    expect(await ProfilePage()).toMatchObject({
      props: { person: PERSON, canManageEmail: false, canEditContactEmail: Boolean(user.delegated) && !user.userId },
    });
  });

  it("does not render a profile when its authorized person is unavailable", async () => {
    jest.mocked(fetchInstitutionalPerson).mockResolvedValue(null);

    await expect(ProfilePage()).rejects.toThrow("NOT_FOUND");
    expect(notFound).toHaveBeenCalledTimes(1);
  });
});

describe("Institutional security permissions", () => {
  it("loads the holder's credentials and sessions while preserving their filters", async () => {
    render(await SecurityPage({ searchParams: Promise.resolve({ search: "Notebook", used: "true", page: "2", size: "10" }) }));

    expect(screen.getByTestId("password-settings")).toBeInTheDocument();
    expect(screen.getByTestId("passkey-manager")).toBeInTheDocument();
    expect(screen.getByTestId("sessions-table")).toBeInTheDocument();
    expect(fetchPasskeys).toHaveBeenCalledWith({ search: "Notebook", used: true, sort: { field: "createdAt", direction: "asc" } });
    expect(fetchInstitutionalSessions).toHaveBeenCalledWith({ page: 2, size: 10 });
  });

  it.each(RESTRICTED_IDENTITIES)("hides credentials and redirects represented identities without an account %#", async (user) => {
    jest.mocked(requireInstitutionalUser).mockResolvedValue(user);

    if (user.delegated && !user.userId) {
      await expect(SecurityPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("NEXT_REDIRECT");

      expect(redirect).toHaveBeenCalledWith("/account/profile");
      expect(fetchPasskeys).not.toHaveBeenCalled();
      expect(fetchInstitutionalSessions).not.toHaveBeenCalled();

      return;
    }

    render(await SecurityPage({ searchParams: Promise.resolve({}) }));

    expect(screen.queryByTestId("password-settings")).not.toBeInTheDocument();
    expect(screen.queryByTestId("passkey-manager")).not.toBeInTheDocument();
    expect(fetchPasskeys).not.toHaveBeenCalled();
    expect(screen.getByTestId("sessions-table")).toBeInTheDocument();
    expect(fetchInstitutionalSessions).toHaveBeenCalledWith({ page: 0, size: 20 });
    expect(
      screen.getByText(
        user.userId
          ? "La contraseña y las llaves de acceso se gestionan desde la cuenta de su titular."
          : "Sin cuenta propia. Podés editar el correo de contacto desde Perfil.",
      ),
    ).toBeInTheDocument();
  });
});

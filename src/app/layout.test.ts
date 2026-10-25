import { getRequestInstitution } from "@common/services/institutional-host/institutional-host.service";

import { metadata as adminMetadata } from "@app/admin/layout";
import { generateMetadata, viewport } from "@app/layout";

jest.mock("next/font/google", () => ({
  Geist: () => ({ variable: "geist" }),
  Geist_Mono: () => ({ variable: "geist-mono" }),
  Manrope: () => ({ variable: "manrope" }),
}));
jest.mock("@common/services/institutional-host/institutional-host.service", () => ({ getRequestInstitution: jest.fn() }));
jest.mock("@app/providers", () => ({ Providers: jest.fn() }));

it("declares the platform PWA only inside the admin layout, not on general institutional access", async () => {
  jest.mocked(getRequestInstitution).mockResolvedValue(undefined);
  const metadata = await generateMetadata();
  expect(metadata.manifest).toBeNull();
  expect(metadata.appleWebApp).toBe(false);
  expect(adminMetadata.manifest).toBe("/manifest.webmanifest");
  expect(adminMetadata.appleWebApp).toEqual({ capable: true, title: "Bemol - Administración", statusBarStyle: "default" });
  expect(metadata.icons).toMatchObject({ apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }] });
  expect(viewport).toEqual({ viewportFit: "cover", colorScheme: "light dark" });
});

it("uses the institutional short name for the installed app while retaining the institutional browser favicon", async () => {
  const id = "22222222-2222-4222-8222-222222222222";
  jest.mocked(getRequestInstitution).mockResolvedValue({
    id,
    name: "Conservatorio Superior de Música Boero",
    shortName: "Boero",
    logoUrl: `/api/v1/institutions/${id}/logo`,
    publicSubdomain: "cboero",
  });
  const metadata = await generateMetadata();
  expect(metadata.manifest).toBe("/manifest.webmanifest");
  expect(metadata.appleWebApp).toMatchObject({ title: "Boero" });
  expect(metadata.icons).toMatchObject({
    icon: [{ url: `/api/public/institutions/${id}/logo` }],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  });
});

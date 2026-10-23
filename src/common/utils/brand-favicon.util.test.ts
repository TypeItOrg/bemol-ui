import { readFileSync } from "node:fs";

import { BEMOL_FAVICON_ICONS, getBrandFaviconIcons } from "@common/utils/brand-favicon.util";

it("keeps the Bemol Apple icon while preserving institutional browser favicons", () => {
  const id = "22222222-2222-4222-8222-222222222222";
  const icons = getBrandFaviconIcons({ id, logoUrl: `/api/v1/institutions/${id}/logo?v=1` });
  expect(icons).toEqual({
    icon: [{ url: `/api/public/institutions/${id}/logo?v=1` }],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  });
  expect(getBrandFaviconIcons()).toBe(BEMOL_FAVICON_ICONS);
  expect(getBrandFaviconIcons({ id, logoUrl: null })).toBe(BEMOL_FAVICON_ICONS);
});

it.each([
  ["pwa-192.png", 192, 6],
  ["pwa-512.png", 512, 6],
  ["pwa-maskable-512.png", 512, 2],
  ["apple-touch-icon.png", 180, 2],
])("ships PNG icon %s at %s pixels with color type %s", (name, size, colorType) => {
  const png = readFileSync(`public/brand/${name}`);
  expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(png.readUInt32BE(16)).toBe(size);
  expect(png.readUInt32BE(20)).toBe(size);
  expect(png[25]).toBe(colorType);
});

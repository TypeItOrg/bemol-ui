import { toPlatformInternalPath, toPlatformPublicPath } from "@features/platform-auth/utils/platform-route-paths.util";

it.each([
  ["/", "/admin"],
  ["/auth/login", "/admin/auth/login"],
  ["/institutions/abc", "/admin/institutions/abc"],
])("maps the public platform page %s to its internal route", (visible, internal) => {
  expect(toPlatformInternalPath(visible)).toBe(internal);
  expect(toPlatformPublicPath(internal)).toBe(visible);
});

it.each(["/administrator", "/institutions/admin", "/auth/login"])("does not remove unrelated path segments from %s", (path) => {
  expect(toPlatformPublicPath(path)).toBe(path);
});

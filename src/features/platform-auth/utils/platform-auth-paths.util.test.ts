import { getRedirectPath, getSafeNextPath } from "@features/platform-auth/utils/platform-auth-paths.util";

describe("platform-auth-paths.util", () => {
  it("returns the default path when next is empty or '/'", () => {
    expect(getSafeNextPath(undefined)).toBe("/");
    expect(getSafeNextPath(null)).toBe("/");
    expect(getSafeNextPath("")).toBe("/");
    expect(getSafeNextPath("/")).toBe("/");
    expect(getSafeNextPath("https://evil.com/")).toBe("/");
  });

  it("preserves safe relative paths", () => {
    expect(getSafeNextPath("/admin/orders?page=1")).toBe("/orders?page=1");
  });

  it("rejects protocol-relative paths", () => {
    expect(getSafeNextPath("//evil.com")).toBe("/");
  });

  it("extracts path and search from absolute urls", () => {
    expect(getSafeNextPath("https://evil.com/a?b=1")).toBe("/a?b=1");
  });

  it("falls back when next is not a valid path", () => {
    expect(getSafeNextPath("not-a-path")).toBe("/");
  });

  it("builds redirect paths without next", () => {
    expect(getRedirectPath("/auth/login")).toBe("/auth/login");
  });

  it("encodes next in redirect paths", () => {
    expect(getRedirectPath("/auth/login", "/?a=1")).toBe("/auth/login?next=%2F%3Fa%3D1");
  });
});

it.each(["/admin//evil.test", "/\\evil.test", "//evil.test"])("rejects unsafe destinations after removing the legacy prefix: %s", (next) => {
  expect(getSafeNextPath(next)).toBe("/");
});
it("preserves a query on the legacy dashboard destination", () => {
  expect(getSafeNextPath("/admin?tab=activity")).toBe("/?tab=activity");
});

it.each([
  "/\\attacker.invalid",
  "/\\\\attacker.invalid",
  "//attacker.invalid",
  "/..//attacker.invalid",
  "/safe/..//attacker.invalid",
  "/safe/../\\attacker.invalid",
  "https://trusted.invalid//attacker.invalid",
  "https://trusted.invalid/safe/..//attacker.invalid",
  "/\n/attacker.invalid",
  "/\t/attacker.invalid",
])("rejects external destinations after URL normalization: %s", (next) => {
  expect(getSafeNextPath(next)).toBe("/");
});

it("preserves idempotent internal normalization with platform public paths", () => {
  expect(getSafeNextPath("/admin/settings/../orders?page=2#section")).toBe("/orders?page=2#section");
  expect(getSafeNextPath(getSafeNextPath("/admin/settings/../orders?page=2#section"))).toBe("/orders?page=2#section");
});

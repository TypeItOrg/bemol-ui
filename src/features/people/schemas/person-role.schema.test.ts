import { personRoleIdsSchema } from "@features/people/schemas/person-role.schema";

const ROLE_A = "019bffff-0000-7000-8000-000000000001";
const ROLE_B = "019bffff-0000-7000-8000-000000000002";

describe("personRoleIdsSchema", () => {
  it("requires at least one role", () => {
    expect(personRoleIdsSchema.safeParse([]).success).toBe(false);
  });

  it("accepts unique role identifiers", () => {
    expect(personRoleIdsSchema.safeParse([ROLE_A, ROLE_B]).success).toBe(true);
  });

  it("rejects duplicate role identifiers", () => {
    expect(personRoleIdsSchema.safeParse([ROLE_A, ROLE_A]).success).toBe(false);
  });
});

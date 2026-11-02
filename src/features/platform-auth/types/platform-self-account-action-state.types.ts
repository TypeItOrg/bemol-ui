import type { FieldActionState } from "@common/utils/action-state.util";

export type PlatformSelfAccountActionState = FieldActionState<"name" | "lastName" | "email" | "currentPassword" | "password" | "confirmPassword">;

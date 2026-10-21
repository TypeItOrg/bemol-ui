import { COMMON_ERROR_MESSAGES } from "@common/constants/error-messages.constants";

export function getApiUrlOrThrow(): string {
  const apiUrl = process.env.BEMOL_API_URL;

  if (!apiUrl) {
    throw new Error(COMMON_ERROR_MESSAGES.MISSING_API_URL);
  }

  return apiUrl;
}

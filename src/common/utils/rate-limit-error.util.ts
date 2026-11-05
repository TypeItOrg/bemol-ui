import { RATE_LIMIT_ERROR_MESSAGE } from "@common/constants/rate-limit.constants";

export function isRateLimitError(error: unknown): boolean {
  return error instanceof Error && error.message.trim() === RATE_LIMIT_ERROR_MESSAGE;
}

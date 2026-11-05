import { RATE_LIMIT_ERROR_MESSAGE } from "@common/constants/rate-limit.constants";
import { isRateLimitError } from "@common/utils/rate-limit-error.util";

export async function safelyRunAction<T extends { error?: string }>(action: Promise<T>, fallbackMessage: string): Promise<T> {
  try {
    return await action;
  } catch (error) {
    return { error: isRateLimitError(error) ? RATE_LIMIT_ERROR_MESSAGE : fallbackMessage } as T;
  }
}

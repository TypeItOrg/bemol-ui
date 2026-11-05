"use client";

import { useEffect, useState } from "react";

import { RATE_LIMIT_ERROR_MESSAGE, RATE_LIMIT_RETRY_MESSAGE, RATE_LIMIT_RETRY_SECONDS } from "@common/constants/rate-limit.constants";
import { isRateLimitError } from "@common/utils/rate-limit-error.util";

export function useAuthRateLimit() {
  const [retryUntil, setRetryUntil] = useState(0);

  useEffect(() => {
    if (!retryUntil) {
      return;
    }

    const timer = window.setTimeout(() => setRetryUntil((current) => (current === retryUntil ? 0 : current)), Math.max(0, retryUntil - Date.now()));

    return () => window.clearTimeout(timer);
  }, [retryUntil]);

  const rateLimited = retryUntil > 0;

  function handleError(error: unknown): boolean {
    if (!isRateLimitError(error)) {
      return false;
    }

    setRetryUntil(Date.now() + RATE_LIMIT_RETRY_SECONDS * 1000);

    return true;
  }

  function getErrorMessage(error?: string | null): string | null {
    if (rateLimited) {
      return RATE_LIMIT_RETRY_MESSAGE;
    }

    return error === RATE_LIMIT_ERROR_MESSAGE ? null : (error ?? null);
  }

  return {
    rateLimited,
    handleError,
    getErrorMessage,
  };
}

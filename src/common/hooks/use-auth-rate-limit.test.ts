import { act, renderHook } from "@testing-library/react";

import { RATE_LIMIT_ERROR_MESSAGE, RATE_LIMIT_RETRY_MESSAGE } from "@common/constants/rate-limit.constants";
import { useAuthRateLimit } from "@common/hooks/use-auth-rate-limit";

afterEach(() => jest.useRealTimers());

it("handles only the edge rejection and hides its message when the wait ends", () => {
  jest.useFakeTimers();
  const { result, unmount } = renderHook(() => useAuthRateLimit());

  expect(result.current.handleError(new Error("Connection failed"))).toBe(false);
  expect(result.current.handleError({ message: RATE_LIMIT_ERROR_MESSAGE })).toBe(false);
  expect(result.current.handleError(new Error("NEXT_REDIRECT"))).toBe(false);
  expect(result.current.rateLimited).toBe(false);

  act(() => {
    expect(result.current.handleError(new Error(RATE_LIMIT_ERROR_MESSAGE))).toBe(true);
  });
  expect(result.current.rateLimited).toBe(true);
  expect(result.current.getErrorMessage(RATE_LIMIT_ERROR_MESSAGE)).toBe(RATE_LIMIT_RETRY_MESSAGE);
  act(() => {
    jest.advanceTimersByTime(1000);
  });
  expect(result.current.getErrorMessage(RATE_LIMIT_ERROR_MESSAGE)).toBe(RATE_LIMIT_RETRY_MESSAGE);
  act(() => {
    jest.advanceTimersByTime(29000);
  });
  expect(result.current.rateLimited).toBe(false);
  expect(result.current.getErrorMessage(RATE_LIMIT_ERROR_MESSAGE)).toBeNull();
  expect(jest.getTimerCount()).toBe(0);

  act(() => {
    result.current.handleError(new Error(RATE_LIMIT_ERROR_MESSAGE));
  });
  expect(result.current.rateLimited).toBe(true);
  unmount();
  expect(jest.getTimerCount()).toBe(0);
});

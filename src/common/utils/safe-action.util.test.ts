import { RATE_LIMIT_ERROR_MESSAGE } from "@common/constants/rate-limit.constants";
import { safelyRunAction } from "@common/utils/safe-action.util";

it("keeps edge rejections distinct from unexpected transport failures", async () => {
  await expect(safelyRunAction(Promise.reject(new Error(RATE_LIMIT_ERROR_MESSAGE)), "Fallback")).resolves.toEqual({
    error: RATE_LIMIT_ERROR_MESSAGE,
  });
  await expect(safelyRunAction(Promise.reject(new Error("Network failed")), "Fallback")).resolves.toEqual({ error: "Fallback" });
  await expect(safelyRunAction(Promise.resolve<{ success?: boolean; error?: string }>({ success: true }), "Fallback")).resolves.toEqual({
    success: true,
  });
});

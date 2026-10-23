import { z } from "zod";

import { institutionalIdentifySchema } from "@features/institutional-auth/schemas/institutional-identify.schema";

export const institutionalPasskeyLoginSchema = z.object({
  institutionId: institutionalIdentifySchema.shape.institutionId,
});

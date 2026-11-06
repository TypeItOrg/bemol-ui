import type { FieldActionState } from "@common/utils/action-state.util";

import type { EnrollmentPdfSettings } from "@features/enrollment-pdf/types/enrollment-pdf-settings.types";

export type EnrollmentPdfActionState = FieldActionState<keyof EnrollmentPdfSettings>;

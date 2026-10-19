import type { ReactNode } from "react";

export type AuditComparisonRow = {
  key: string;
  label: ReactNode;
  before: ReactNode;
  after: ReactNode;
};

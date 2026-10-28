export type AccountAccess = {
  status: string;
  invitation: {
    id: string;
    status: "PENDING" | "EXPIRED" | "USED" | "CANCELLED";
    purpose: "INITIAL_ACCESS" | "AUTONOMY";
    issuerKind: "PLATFORM" | "INSTITUTION" | "GUARDIAN";
    issuerId: string;
    issuerName: string;
    issuedAt: string;
    expiresAt: string;
    usedAt: string | null;
    cancelledAt: string | null;
    mailOutcome: "SENT" | "FAILED" | null;
  } | null;
};

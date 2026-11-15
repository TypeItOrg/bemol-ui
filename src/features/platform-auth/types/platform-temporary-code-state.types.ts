export type PlatformTemporaryCodeState = {
  code?: string;
  expiresAt?: string;
  recovery?: boolean;
  error?: string;
  requiresReauth?: boolean;
  cancelled?: boolean;
};

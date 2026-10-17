export const CONTEXTUAL_SEARCH_SCOPE = {
  PLATFORM: "platform",
  INSTITUTIONAL: "institutional",
  SELF_SERVICE: "self-service",
} as const;

export type ContextualSearchScope = (typeof CONTEXTUAL_SEARCH_SCOPE)[keyof typeof CONTEXTUAL_SEARCH_SCOPE];

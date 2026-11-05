// Keep this response contract aligned with bemol-infra's Nginx 429 handler.
export const RATE_LIMIT_ERROR_MESSAGE = "Demasiadas solicitudes. Intentá nuevamente en unos instantes.";

export const RATE_LIMIT_RETRY_MESSAGE = "Demasiadas solicitudes. Intentá de nuevo en unos instantes.";

export const RATE_LIMIT_RETRY_SECONDS = 30;

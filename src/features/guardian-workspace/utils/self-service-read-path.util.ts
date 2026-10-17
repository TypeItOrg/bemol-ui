export function getSelfServiceReadPath(applicationId: string, personId?: string): string {
  return personId
    ? `/api/institutional/self-service/${personId}/enrollment-applications/${applicationId}`
    : `/api/enrollment-applications/${applicationId}`;
}

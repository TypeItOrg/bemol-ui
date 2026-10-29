import { GUARDIAN_LINK_MESSAGES } from "@features/guardian-links/constants/guardian-link.constants";
import type { GuardianLinkPerson } from "@features/guardian-links/types/guardian-link-person.types";
import type { GuardianLinkRequest } from "@features/guardian-links/types/guardian-link-request.types";

export function getGuardianLinkReviewPerson(request: GuardianLinkRequest): GuardianLinkPerson {
  return request.dependent.personId ? request.dependent : (request.matchingPerson ?? request.dependent);
}

export function getGuardianLinkApprovalError(request: GuardianLinkRequest): string | null {
  return request.status === "PENDING" && request.requestMode === "EXISTING" && !getGuardianLinkReviewPerson(request).personId
    ? GUARDIAN_LINK_MESSAGES.NO_MATCHING_PERSON
    : null;
}

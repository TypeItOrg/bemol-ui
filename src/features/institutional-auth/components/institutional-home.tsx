import { Suspense, type ReactElement } from "react";

import {
  BookOpenIcon,
  Building2Icon,
  ClipboardListIcon,
  GraduationCapIcon,
  HistoryIcon,
  Settings2Icon,
  UserRoundIcon,
  type LucideIcon,
} from "lucide-react";

import { ACADEMIC_RESOURCE_DESCRIPTIONS, getReadableAcademicResources } from "@features/academic/components/academic-resource-links";
import { ACADEMIC_COLLECTION_CONFIG } from "@features/academic/config/academic-collection.config";
import { ACADEMIC_RESOURCE_ICONS } from "@features/academic/config/academic-resource-icons.config";
import type { AcademicCollectionResource } from "@features/academic/types/academic-collection-resource.types";
import { AcademicResource } from "@features/academic/types/academic-resource.types";
import { getAcademicAccess } from "@features/academic/utils/academic-access.util";
import { GUARDIAN_DEPENDENTS_PAGE_PATH } from "@features/guardian-dependents/constants/guardian-dependent.constants";
import { GUARDIAN_LINKS_PAGE_PATH } from "@features/guardian-links/constants/guardian-link.constants";
import { fetchOperatingProfile } from "@features/guardian-workspace/services/operating-profile.service";
import { getInstitutionalActivityHomeLinks } from "@features/institutional-activity/utils/institutional-activity-access.util";
import { InstitutionalHomeCard } from "@features/institutional-auth/components/institutional-home-card";
import { InstitutionalHomeHero } from "@features/institutional-auth/components/institutional-home-hero";
import { InstitutionalHomeSkeleton } from "@features/institutional-auth/components/institutional-home-skeleton";
import { InstitutionalHomeSelector, type InstitutionalHomeSectionItem } from "@features/institutional-auth/components/institutional-home-subsection";
import { fetchInstitutionalPerson } from "@features/institutional-auth/services/fetch-institutional-person.service";
import { getInstitutionalBrand } from "@features/institutional-auth/services/get-institutional-brand.service";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { canStartEnrollmentApplication, canViewOwnFormation } from "@features/institutional-auth/utils/institutional-applicant-role.util";
import { getGreeting } from "@features/institutional-auth/utils/institutional-greeting.util";
import {
  getInstitutionalAcademicOfferLink,
  getInstitutionalEnrollmentHomeLinks,
  getInstitutionalFormationHomeLinks,
  getInstitutionalHomeLinks,
  type InstitutionalHomeLink,
} from "@features/institutional-auth/utils/institutional-home-access.util";
import type { PublicInstitution } from "@features/institutions/types/public-institution.types";

export async function InstitutionalHome({ personId }: { personId?: string }): Promise<ReactElement> {
  const institution = await getInstitutionalBrand();

  return (
    <Suspense fallback={<InstitutionalHomeSkeleton institution={institution} />}>
      <InstitutionalHomeContent personId={personId} institution={institution} />
    </Suspense>
  );
}

async function InstitutionalHomeContent({
  personId,
  institution,
}: {
  personId?: string;
  institution?: Pick<PublicInstitution, "id" | "name" | "logoUrl">;
}): Promise<ReactElement> {
  const [user, person] = await Promise.all([
    requireInstitutionalUser(),
    fetchInstitutionalPerson(),
    personId ? fetchOperatingProfile(personId) : null,
  ]);

  const links = getInstitutionalHomeLinks(user);

  const enrollmentLinks = getInstitutionalEnrollmentHomeLinks(user);

  const academicOfferLink = getInstitutionalAcademicOfferLink(user);

  const academicResources = getReadableAcademicResources(getAcademicAccess(user));

  const operationalResources = academicResources.filter((item) => item === AcademicResource.ACADEMIC_YEAR || item === AcademicResource.COURSE);

  const configurationResources = academicResources.filter((item) => item !== AcademicResource.ACADEMIC_YEAR && item !== AcademicResource.COURSE);

  const baseFormationLinks = [...enrollmentLinks.filter((link) => link.href.startsWith("/my-teaching")), ...getInstitutionalFormationHomeLinks(user)];

  const standaloneOffer = operationalResources.length === 0 ? academicOfferLink : undefined;

  const embedOfferInPersonal = Boolean(
    standaloneOffer && ((canStartEnrollmentApplication(user) && !canViewOwnFormation(user)) || baseFormationLinks.length === 0),
  );

  const personalLinks = [
    ...(embedOfferInPersonal && standaloneOffer ? [standaloneOffer] : []),
    ...enrollmentLinks.filter(
      (link) =>
        !["/course-enrollments", "/enrollment-applications", GUARDIAN_DEPENDENTS_PAGE_PATH, GUARDIAN_LINKS_PAGE_PATH].includes(link.href) &&
        !link.href.startsWith("/my-teaching"),
    ),
    ...links.filter((link) => link.href === "/account/profile"),
    ...enrollmentLinks.filter((link) => link.href === GUARDIAN_DEPENDENTS_PAGE_PATH),
  ];

  const sections = [
    createHomeSection("institutional-management-title", "Gestión institucional", Building2Icon, [
      ...links.filter((link) => link.href !== "/account/profile"),
      ...enrollmentLinks.filter((link) => link.href === GUARDIAN_LINKS_PAGE_PATH),
    ]),
    createHomeSection(
      "academic-management-title",
      "Área académica",
      GraduationCapIcon,
      operationalResources.length > 0 ? [...(academicOfferLink ? [academicOfferLink] : []), ...operationalResources.map(toAcademicHomeLink)] : [],
      "Secciones académicas",
    ),
    createHomeSection(
      "academic-configuration-title",
      "Configuración académica",
      Settings2Icon,
      configurationResources.map(toAcademicHomeLink),
      "Secciones académicas",
    ),
    createHomeSection(
      "enrollment-management-title",
      "Inscripciones y cursadas",
      ClipboardListIcon,
      enrollmentLinks.filter((link) => link.href === "/course-enrollments" || link.href === "/enrollment-applications"),
    ),
    createHomeSection("institutional-activity-title", "Actividad", HistoryIcon, getInstitutionalActivityHomeLinks(user), "Actividad institucional"),
    createHomeSection("formation-title", "Formación", BookOpenIcon, [
      ...(standaloneOffer && !embedOfferInPersonal ? [standaloneOffer] : []),
      ...baseFormationLinks,
    ]),
    createHomeSection("personal-space-title", "Mi espacio", UserRoundIcon, personalLinks, "Herramientas personales"),
  ].filter((section): section is InstitutionalHomeSectionItem => section !== null);

  return (
    <main className="flex min-h-full flex-1 flex-col gap-4 min-[1600px]:[@media(min-height:860px)]:h-[calc(var(--app-viewport-height)-7.625rem)] min-[1600px]:[@media(min-height:860px)]:max-h-[calc(var(--app-viewport-height)-7.625rem)] min-[1600px]:[@media(min-height:860px)]:min-h-[540px] min-[1600px]:[@media(min-height:860px)]:flex-none min-[1600px]:[@media(min-height:860px)]:overflow-hidden">
      <InstitutionalHomeHero
        greeting={getGreeting(new Date())}
        name={user.name}
        institutionName={person?.institutionName}
        primaryRole={user.roles[0] ?? "Usuario institucional"}
        institution={institution}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 px-3 pb-3 md:px-4 md:pb-4">
        <InstitutionalHomeSelector sections={sections} />
      </div>
    </main>
  );
}

function toAcademicHomeLink(resource: AcademicCollectionResource): InstitutionalHomeLink {
  return {
    href: `/${resource}`,
    title: ACADEMIC_COLLECTION_CONFIG[resource].title,
    description: ACADEMIC_RESOURCE_DESCRIPTIONS[resource],
    icon: ACADEMIC_RESOURCE_ICONS[resource],
  };
}

function createHomeSection(
  id: string,
  title: string,
  Icon: LucideIcon,
  links: readonly InstitutionalHomeLink[],
  navLabel?: string,
): InstitutionalHomeSectionItem | null {
  if (links.length === 0) {
    return null;
  }

  return {
    id,
    title,
    itemCount: links.length,
    menuIcon: <Icon aria-hidden="true" className="size-4 shrink-0" />,
    content: (
      <nav aria-label={navLabel ?? title} className="grid min-h-full flex-1 auto-rows-[minmax(8.5rem,1fr)] grid-cols-6 gap-3 sm:gap-4">
        {links.map((link, index) => (
          <InstitutionalHomeCard key={link.href} link={link} index={index} totalCount={links.length} />
        ))}
      </nav>
    ),
  };
}

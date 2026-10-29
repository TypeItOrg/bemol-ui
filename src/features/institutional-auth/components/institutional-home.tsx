import { Suspense, type ReactElement } from "react";

import { BookOpenIcon, Building2Icon, ClipboardListIcon, GraduationCapIcon, HistoryIcon, Settings2Icon, UserRoundIcon } from "lucide-react";

import { AcademicResourceLinks, getReadableAcademicResources } from "@features/academic/components/academic-resource-links";
import { AcademicResource } from "@features/academic/types/academic-resource.types";
import { getAcademicAccess } from "@features/academic/utils/academic-access.util";
import { GUARDIAN_DEPENDENTS_PAGE_PATH } from "@features/guardian-dependents/constants/guardian-dependent.constants";
import { GUARDIAN_LINKS_PAGE_PATH } from "@features/guardian-links/constants/guardian-link.constants";
import { fetchOperatingProfile } from "@features/guardian-workspace/services/operating-profile.service";
import { getInstitutionalActivityHomeLinks } from "@features/institutional-activity/utils/institutional-activity-access.util";
import { InstitutionalHomeHero } from "@features/institutional-auth/components/institutional-home-hero";
import { InstitutionalHomeSkeleton } from "@features/institutional-auth/components/institutional-home-skeleton";
import { HomeAccessRow, HomeSubsection } from "@features/institutional-auth/components/institutional-home-subsection";
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

  const activityLinks = getInstitutionalActivityHomeLinks(user);

  const managementLinks = [
    ...links.filter((link) => link.href !== "/account"),
    ...enrollmentLinks.filter((link) => link.href === GUARDIAN_LINKS_PAGE_PATH),
  ];

  const institutionalEnrollmentLinks = enrollmentLinks.filter(
    (link) => link.href === "/course-enrollments" || link.href === "/enrollment-applications",
  );

  const academicOfferLink = getInstitutionalAcademicOfferLink(user);

  const academicResources = getReadableAcademicResources(getAcademicAccess(user));

  const operationalResources = academicResources.filter(
    (resource) => resource === AcademicResource.ACADEMIC_YEAR || resource === AcademicResource.COURSE,
  );

  const configurationResources = academicResources.filter(
    (resource) => resource !== AcademicResource.ACADEMIC_YEAR && resource !== AcademicResource.COURSE,
  );

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
    ...links.filter((link) => link.href === "/account"),
    ...enrollmentLinks.filter((link) => link.href === GUARDIAN_DEPENDENTS_PAGE_PATH),
  ];

  const formationLinks = [...(standaloneOffer && !embedOfferInPersonal ? [standaloneOffer] : []), ...baseFormationLinks];

  const primaryRole = user.roles[0] ?? "Usuario institucional";

  return (
    <main className="flex min-h-full flex-1 flex-col gap-4">
      <InstitutionalHomeHero
        greeting={getGreeting(new Date())}
        name={user.name}
        institutionName={person?.institutionName}
        primaryRole={primaryRole}
        institution={institution}
      />

      <div className="flex flex-col gap-4 px-3 pb-3 md:px-4 md:pb-4">
        {personalLinks.length > 0 ? (
          <HomeSubsection
            id="personal-space-title"
            title="Mi espacio"
            description="Gestioná tus inscripciones, las personas a tu cargo y tu perfil."
            icon={UserRoundIcon}
            imageSrc="/images/institutional-management.webp"
            imageSide="right"
          >
            <nav aria-label="Herramientas personales" className="[&>a]:bg-background grid gap-4">
              {personalLinks.map((link) => (
                <HomeAccessRow key={link.href} link={link} />
              ))}
            </nav>
          </HomeSubsection>
        ) : null}

        {managementLinks.length > 0 ? (
          <HomeSubsection
            id="institutional-management-title"
            title="Gestión institucional"
            description="Administrá la información, las personas y los accesos de la institución."
            icon={Building2Icon}
            imageSrc="/images/institutional-management.webp"
          >
            <nav aria-label="Gestión institucional" className="[&>a]:bg-background grid gap-4">
              {managementLinks.map((link) => (
                <HomeAccessRow key={link.href} link={link} />
              ))}
            </nav>
          </HomeSubsection>
        ) : null}

        {operationalResources.length > 0 ? (
          <HomeSubsection
            id="academic-management-title"
            title="Área académica"
            description="Consultá la oferta y organizá los ciclos lectivos y cursos."
            icon={GraduationCapIcon}
            imageSrc="/images/academic-management.webp"
            imageSide="right"
          >
            <AcademicResourceLinks
              basePath=""
              resources={operationalResources}
              leadingContent={academicOfferLink ? <HomeAccessRow link={academicOfferLink} /> : undefined}
              prominent
              className="[&>a]:bg-background"
            />
          </HomeSubsection>
        ) : null}

        {configurationResources.length > 0 ? (
          <HomeSubsection
            id="academic-configuration-title"
            title="Configuración académica"
            description="Definí la estructura curricular y los recursos de la institución."
            icon={Settings2Icon}
            imageSrc="/images/academic-management.webp"
            imageSide="right"
          >
            <AcademicResourceLinks basePath="" resources={configurationResources} prominent className="[&>a]:bg-background" />
          </HomeSubsection>
        ) : null}

        {institutionalEnrollmentLinks.length > 0 ? (
          <HomeSubsection
            id="enrollment-management-title"
            title="Inscripciones y cursadas"
            description="Revisá las solicitudes de inscripción y gestioná las cursadas de la institución."
            icon={ClipboardListIcon}
            imageSrc="/images/institutional-management.webp"
          >
            <nav aria-label="Inscripciones y cursadas" className="[&>a]:bg-background grid gap-4">
              {institutionalEnrollmentLinks.map((link) => (
                <HomeAccessRow key={link.href} link={link} />
              ))}
            </nav>
          </HomeSubsection>
        ) : null}

        {activityLinks.length > 0 ? (
          <HomeSubsection
            id="institutional-activity-title"
            title="Actividad"
            description="Consultá la actividad registrada en la institución."
            icon={HistoryIcon}
            imageSrc="/images/institutional-management.webp"
          >
            <nav aria-label="Actividad institucional" className="[&>a]:bg-background grid gap-4">
              {activityLinks.map((link) => (
                <HomeAccessRow key={link.href} link={link} />
              ))}
            </nav>
          </HomeSubsection>
        ) : null}

        {formationLinks.length > 0 ? (
          <HomeSubsection
            id="formation-title"
            title="Formación"
            description="Seguí tu recorrido académico en la institución."
            icon={BookOpenIcon}
            imageSrc="/images/academic-management.webp"
            imageSide="right"
          >
            <nav aria-label="Formación" className="[&>a]:bg-background grid gap-4">
              {formationLinks.map((link) => (
                <HomeAccessRow key={link.href} link={link} />
              ))}
            </nav>
          </HomeSubsection>
        ) : null}
      </div>
    </main>
  );
}

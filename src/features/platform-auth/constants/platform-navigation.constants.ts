import {
  BookMarkedIcon,
  BuildingIcon,
  CalendarRangeIcon,
  ClipboardListIcon,
  ClockIcon,
  FileTextIcon,
  FingerprintIcon,
  GraduationCapIcon,
  HouseIcon,
  KeyRoundIcon,
  LibraryBigIcon,
  Music2Icon,
  MailIcon,
  RouteIcon,
  ScrollTextIcon,
  UserLockIcon,
  UsersIcon,
} from "lucide-react";

import type { NavigationItem } from "@common/utils/navigation.util";

const PRIMARY_NAVIGATION_ITEM = {
  title: "Inicio",
  url: "/",
  icon: HouseIcon,
  exact: true,
} as const satisfies NavigationItem;

const MANAGEMENT_NAVIGATION_ITEMS = [
  {
    title: "Instituciones",
    url: "/institutions",
    icon: BuildingIcon,
  },
  {
    title: "Usuarios",
    url: "/people",
    icon: UsersIcon,
  },
  {
    title: "Roles y permisos",
    url: "/roles",
    icon: UserLockIcon,
  },
] as const satisfies readonly NavigationItem[];

const ACADEMIC_NAVIGATION_ITEMS = [
  { title: "Documentación", url: "/documentation", icon: FileTextIcon },
  {
    title: "Ciclos lectivos",
    url: "/academic-years",
    icon: CalendarRangeIcon,
  },
  {
    title: "Trayectos formativos",
    url: "/training-paths",
    icon: RouteIcon,
  },
  {
    title: "Planes de estudio",
    url: "/study-plans",
    icon: BookMarkedIcon,
  },
  {
    title: "Espacios académicos",
    url: "/academic-spaces",
    icon: LibraryBigIcon,
  },
  {
    title: "Instrumentos",
    url: "/instruments",
    icon: Music2Icon,
  },
  {
    title: "Cursos",
    url: "/courses",
    icon: GraduationCapIcon,
  },
  {
    title: "Turnos",
    url: "/shifts",
    icon: ClockIcon,
  },
] as const satisfies readonly NavigationItem[];

const ENROLLMENT_NAVIGATION_ITEMS = [
  {
    title: "Períodos de inscripción",
    url: "/enrollment-periods",
    icon: CalendarRangeIcon,
  },
  {
    title: "Solicitudes de inscripción",
    url: "/enrollment-applications",
    icon: ClipboardListIcon,
  },
  {
    title: "Solicitudes de vinculación",
    url: "/guardian-links",
    icon: UsersIcon,
  },
] as const satisfies readonly NavigationItem[];

const PLATFORM_NAVIGATION_ITEM = {
  title: "Administradores",
  url: "/accounts",
  icon: FingerprintIcon,
} as const satisfies NavigationItem;

const PLATFORM_AUDIT_NAVIGATION_ITEM = {
  title: "Auditoría",
  url: "/audit-events",
  icon: ScrollTextIcon,
} as const satisfies NavigationItem;

const PLATFORM_EMAIL_NAVIGATION_ITEM = {
  title: "Correos",
  url: "/emails",
  icon: MailIcon,
} as const satisfies NavigationItem;

const PLATFORM_PASSKEYS_NAVIGATION_ITEM = {
  title: "Llaves de acceso",
  url: "/account/passkeys",
  icon: KeyRoundIcon,
} as const satisfies NavigationItem;

export const PLATFORM_NAVIGATION_ITEMS = [
  PRIMARY_NAVIGATION_ITEM,
  ...MANAGEMENT_NAVIGATION_ITEMS,
  ...ACADEMIC_NAVIGATION_ITEMS,
  ...ENROLLMENT_NAVIGATION_ITEMS,
  PLATFORM_NAVIGATION_ITEM,
  PLATFORM_AUDIT_NAVIGATION_ITEM,
  PLATFORM_EMAIL_NAVIGATION_ITEM,
  PLATFORM_PASSKEYS_NAVIGATION_ITEM,
] as const satisfies readonly NavigationItem[];

export const PLATFORM_PRIMARY_NAVIGATION_ITEM = PRIMARY_NAVIGATION_ITEM;

export const PLATFORM_BOTTOM_NAVIGATION_ITEMS = [...MANAGEMENT_NAVIGATION_ITEMS, PLATFORM_NAVIGATION_ITEM] as const;

export const PLATFORM_NAVIGATION_SECTIONS = [
  {
    items: [PRIMARY_NAVIGATION_ITEM],
  },
  {
    label: "Gestión",
    items: MANAGEMENT_NAVIGATION_ITEMS,
  },
  {
    label: "Académico",
    items: ACADEMIC_NAVIGATION_ITEMS,
  },
  {
    label: "Inscripciones",
    items: ENROLLMENT_NAVIGATION_ITEMS,
  },
  {
    label: "Plataforma",
    items: [PLATFORM_NAVIGATION_ITEM, PLATFORM_AUDIT_NAVIGATION_ITEM, PLATFORM_EMAIL_NAVIGATION_ITEM],
  },
  {
    label: "Cuenta",
    items: [PLATFORM_PASSKEYS_NAVIGATION_ITEM],
  },
] as const;

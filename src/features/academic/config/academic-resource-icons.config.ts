import {
  BookMarkedIcon,
  BookPlusIcon,
  CalendarIcon,
  CalendarRangeIcon,
  ClockIcon,
  GitBranchPlusIcon,
  GraduationCapIcon,
  Layers3Icon,
  LibraryBigIcon,
  Music2Icon,
  RouteIcon,
  type LucideIcon,
} from "lucide-react";

import { AcademicResource } from "@features/academic/types/academic-resource.types";

export const ACADEMIC_RESOURCE_ICONS: Readonly<Record<AcademicResource, LucideIcon>> = {
  [AcademicResource.ACADEMIC_YEAR]: CalendarRangeIcon,
  [AcademicResource.TRAINING_PATH]: RouteIcon,
  [AcademicResource.STUDY_PLAN]: BookMarkedIcon,
  [AcademicResource.ACADEMIC_LEVEL]: Layers3Icon,
  [AcademicResource.STUDY_PLAN_SPACE]: BookPlusIcon,
  [AcademicResource.PREREQUISITE]: GitBranchPlusIcon,
  [AcademicResource.ACADEMIC_SPACE]: LibraryBigIcon,
  [AcademicResource.INSTRUMENT]: Music2Icon,
  [AcademicResource.COURSE]: GraduationCapIcon,
  [AcademicResource.SHIFT]: ClockIcon,
};

export const ACADEMIC_DETAIL_COLUMN_ICONS: Readonly<Partial<Record<string, LucideIcon>>> = {
  "Ciclo lectivo": CalendarRangeIcon,
  "Fecha de finalización": CalendarIcon,
  "Fecha de inicio": CalendarIcon,
  Instrumento: Music2Icon,
  Nivel: Layers3Icon,
  "Plan de estudio": BookMarkedIcon,
  "Trayecto formativo": RouteIcon,
  "Vigente desde": CalendarIcon,
  "Vigente hasta": CalendarIcon,
};

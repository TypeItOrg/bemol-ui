import type { AcademicCollectionResource } from "@features/academic/types/academic-collection-resource.types";
import { AcademicResource } from "@features/academic/types/academic-resource.types";

// Resources without a detail page are edited directly from their collection.
export function hasAcademicDetailPage(resource: AcademicCollectionResource): boolean {
  return resource !== AcademicResource.ACADEMIC_YEAR && resource !== AcademicResource.INSTRUMENT;
}

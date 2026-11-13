import { Music2Icon } from "lucide-react";

import { fetchInstrument, fetchInstruments } from "@features/academic/services/academic.service";
import type { AcademicCollectionConfig } from "@features/academic/types/academic-collection-config.types";
import { AcademicResource } from "@features/academic/types/academic-resource.types";
import type { Instrument } from "@features/academic/types/instrument.types";
import { activeResource } from "@features/academic/utils/academic-collection-filters.util";

const baseConfig: AcademicCollectionConfig = activeResource({
  resource: AcademicResource.INSTRUMENT,
  title: "Instrumentos",
  createLabel: "Nuevo instrumento",
  createIcon: Music2Icon,
  singular: "instrumento",
  plural: "instrumentos",
  columns: { primaryLabel: "Nombre", detailLabels: ["Descripción"] },
  canRead: (access) => access.instrumentRead,
  canCreate: (access) => access.instrumentCreate,
  canDelete: (access) => access.instrumentDelete,
  canUpdate: (access) => access.instrumentUpdate,
  canChangeStatus: (access) => access.instrumentStatusUpdate,
  canRestore: (access) => access.instrumentRestore,
  fetchPage: ({ scope, global, institutionId, page, size, search, active, deleted }) =>
    fetchInstruments(scope, global ? undefined : institutionId, {
      page,
      size,
      search,
      active,
      deleted,
      institutionId: global ? institutionId : undefined,
    }),
  fetchDetail: fetchInstrument,
});

export const instrumentCollectionConfig: AcademicCollectionConfig = {
  ...baseConfig,
  toRow: (item) => ({ ...baseConfig.toRow(item), icon: (item as Instrument).icon }),
};

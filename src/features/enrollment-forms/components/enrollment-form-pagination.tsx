import type { ReactElement } from "react";

import { DataTablePagination } from "@common/components/ui/data-table-pagination";
import { PAGE_SIZE_OPTIONS } from "@common/utils/pagination-query.util";

export function EnrollmentFormPagination({
  page,
  size,
  totalItems = 0,
  totalPages = 0,
  pending,
  onPage,
  onSize,
}: {
  page: number;
  size: number;
  totalItems?: number;
  totalPages?: number;
  pending: boolean;
  onPage: (value: number) => void;
  onSize: (value: number) => void;
}): ReactElement {
  return (
    <DataTablePagination
      page={page}
      size={size}
      totalPages={totalPages}
      summaryLabel={`${totalItems} registros`}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      isPending={pending}
      onPageChange={onPage}
      onPageSizeChange={(value) => onSize(Number(value))}
    />
  );
}

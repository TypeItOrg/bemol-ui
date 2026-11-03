import { redirect } from "next/navigation";

import type { PaginationSearchParams } from "@common/types/pagination-search-params.types";

import { parseSessionsPaginationParams } from "@features/institutional-auth/utils/session-pagination.util";

export default async function SessionsPage({ searchParams }: { searchParams: Promise<PaginationSearchParams> }): Promise<never> {
  const { page, size } = parseSessionsPaginationParams(await searchParams);

  const query = new URLSearchParams({ page: String(page), size: String(size) });

  redirect(`/account/security?${query}#account-sessions`);
}

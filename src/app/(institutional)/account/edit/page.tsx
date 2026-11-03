import { redirect } from "next/navigation";

import type { QueryParamValue } from "@common/types/query-param.types";
import { getSafeReturnTo } from "@common/utils/return-to.util";

export default async function EditProfilePage({ searchParams }: { searchParams: Promise<{ returnTo?: QueryParamValue }> }): Promise<never> {
  const { returnTo } = await searchParams;

  const query = new URLSearchParams({ returnTo: getSafeReturnTo(returnTo, "/account/profile") });

  redirect(`/account/profile/edit?${query}`);
}

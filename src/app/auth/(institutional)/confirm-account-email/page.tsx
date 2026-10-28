import type { ReactElement } from "react";

import { Card, CardContent } from "@common/components/ui/card";

import { ConfirmAccountEmailForm } from "@features/institutional-auth/components/confirm-account-email-form";

export default async function ConfirmAccountEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }): Promise<ReactElement> {
  const { token } = await searchParams;

  return (
    <Card className="mx-auto w-full max-w-md p-0">
      <CardContent className="p-6 sm:p-8">
        <ConfirmAccountEmailForm token={typeof token === "string" ? token : ""} />
      </CardContent>
    </Card>
  );
}

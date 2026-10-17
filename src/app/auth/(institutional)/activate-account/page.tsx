import type { ReactElement } from "react";

import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent } from "@common/components/ui/card";

import { InstitutionalBrandIdentity, InstitutionalBrandPanel } from "@features/institutional-auth/components/institutional-brand-identity";
import { OwnAccessActivationForm } from "@features/institutional-auth/components/own-access-activation-form";

export const metadata: Metadata = {
  title: "Activá tu cuenta",
  description: "Configurá tu contraseña para acceder a tu perfil.",
};

export default async function ActivateAccount({ searchParams }: { searchParams: Promise<{ token?: string }> }): Promise<ReactElement> {
  const { token } = await searchParams;

  if (typeof token === "string" && token) {
    return (
      <Card className="animate-fade-in-up mx-auto w-full max-w-240 p-0">
        <CardContent className="grid-cols-2 p-0 md:grid">
          <OwnAccessActivationForm token={token} />
          <InstitutionalBrandPanel showInstitutionName={false} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in-up mx-auto w-full max-w-md p-0">
      <CardContent className="flex flex-col items-center space-y-4 p-6 text-center md:p-8">
        <InstitutionalBrandIdentity
          className="w-full"
          imageContainerClassName="size-20"
          imageClassName="max-h-20 max-w-20"
          showInstitutionName={false}
        />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Enlace inválido</h1>
          <p className="text-muted-foreground text-sm">Solicitá una nueva invitación para activar tu cuenta.</p>
        </div>
        <Link className="text-primary font-medium underline underline-offset-4" href="/auth/login">
          Iniciar sesión
        </Link>
      </CardContent>
    </Card>
  );
}

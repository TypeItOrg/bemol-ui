"use client";

import { useState, type ReactElement } from "react";

import { ShieldCheckIcon } from "lucide-react";

import { SectionHeader } from "@common/components/section-header";
import { Button } from "@common/components/ui/button";
import { Input } from "@common/components/ui/input";

import { PlatformAccountSecurityDialog } from "@features/platform-auth/components/platform-account-security-dialog";

export function PlatformPasswordSettings(): ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <section className="bg-muted/25 rounded-xl border p-4 sm:p-5">
      <header className="-mx-4 border-b px-4 pb-4 sm:-mx-5 sm:px-5 sm:pb-5">
        <SectionHeader icon={ShieldCheckIcon} title="Contraseña" description="Administrá tu contraseña de acceso." />
      </header>
      <div className="mt-4 flex flex-col gap-3 sm:mt-5 sm:flex-row sm:items-center">
        <Input aria-label="Contraseña configurada" value="••••••••••••" readOnly className="bg-muted/50" />
        <Button id="change-platform-password" className="shrink-0" variant="outline" size="lg" onClick={() => setOpen(true)}>
          Cambiar contraseña
        </Button>
      </div>
      {open ? <PlatformAccountSecurityDialog section="password" onClose={() => setOpen(false)} /> : null}
    </section>
  );
}

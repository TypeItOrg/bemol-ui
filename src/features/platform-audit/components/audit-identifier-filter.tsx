"use client";

import { useState, type ReactElement } from "react";

import { Input } from "@common/components/ui/input";

export function AuditIdentifierFilter({
  label,
  value,
  onCommit,
}: {
  label: string;
  value?: string;
  onCommit: (value: string | undefined) => void;
}): ReactElement {
  const [draft, setDraft] = useState(value ?? "");

  function commit(): void {
    const normalized = draft.trim();

    if (normalized !== (value ?? "")) {
      onCommit(normalized || undefined);
    }
  }

  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-foreground text-sm font-medium">{label}</span>
      <Input
        autoComplete="off"
        value={draft}
        maxLength={100}
        onBlur={commit}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
      />
    </label>
  );
}

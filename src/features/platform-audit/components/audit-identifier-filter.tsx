"use client";

import { useRef, useState, type ReactElement } from "react";

import { XIcon } from "lucide-react";

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@common/components/ui/input-group";

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

  const inputRef = useRef<HTMLInputElement>(null);

  function commit(): void {
    const normalized = draft.trim();

    if (normalized !== (value ?? "")) {
      onCommit(normalized || undefined);
    }
  }

  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-foreground text-sm font-medium">{label}</span>
      <InputGroup className="h-9">
        <InputGroupInput
          ref={inputRef}
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
        {draft ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              size="icon-sm"
              aria-label={`Limpiar ${label.toLowerCase()}`}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => {
                setDraft("");
                onCommit(undefined);
                inputRef.current?.focus();
              }}
            >
              <XIcon aria-hidden="true" />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
    </label>
  );
}

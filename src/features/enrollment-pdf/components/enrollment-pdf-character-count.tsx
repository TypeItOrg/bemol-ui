import type { ReactElement } from "react";

import { InputGroupAddon, InputGroupText } from "@common/components/ui/input-group";

export function EnrollmentPdfCharacterCount({
  id,
  count,
  maxLength,
  align = "block-end",
}: {
  id: string;
  count: number;
  maxLength: number;
  align?: "inline-end" | "block-end";
}): ReactElement {
  return (
    <InputGroupAddon
      align={align}
      className="shrink-0 justify-end data-[align=inline-end]:pr-1"
      onClick={(event) => event.currentTarget.parentElement?.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea")?.focus()}
    >
      <InputGroupText id={id} className="block text-xs whitespace-nowrap tabular-nums">
        <span aria-hidden="true">{`${count}/${maxLength}`}</span>
        <span className="sr-only">{`${count} de ${maxLength} caracteres`}</span>
      </InputGroupText>
    </InputGroupAddon>
  );
}

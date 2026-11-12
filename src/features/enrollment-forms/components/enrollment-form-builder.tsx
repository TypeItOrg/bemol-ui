"use client";

import { useRef, type ReactElement } from "react";

import { LockKeyholeIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@common/components/ui/dropdown-menu";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@common/components/ui/select";
import { cn } from "@common/utils/cn.util";

import { EnrollmentFormSectionEditor } from "@features/enrollment-forms/components/enrollment-form-section-editor";
import { ENROLLMENT_NATIVE_LABELS } from "@features/enrollment-forms/constants/enrollment-form.constants";
import type { EnrollmentFormDefinition } from "@features/enrollment-forms/types/enrollment-form-definition.types";
import type { EnrollmentFormNativeBlock } from "@features/enrollment-forms/types/enrollment-form-native-block.types";
import type { EnrollmentFormQuestion } from "@features/enrollment-forms/types/enrollment-form-question.types";
import { enrollmentBlockLocked, moveEnrollmentItem, newEnrollmentSection } from "@features/enrollment-forms/utils/enrollment-form-editor.util";

export function EnrollmentFormBuilder({
  definition,
  selected,
  selectedQuestion,
  onSelectQuestion,
  onSelect,
  disabled,
  readOnly,
  onChange,
  onQuestionIdChange,
}: {
  definition: EnrollmentFormDefinition;
  selected?: string;
  selectedQuestion?: string;
  onSelectQuestion: (id: string | undefined) => void;
  onSelect: (id: string | undefined) => void;
  disabled: boolean;
  readOnly: boolean;
  onChange: (value: EnrollmentFormDefinition) => void;
  onQuestionIdChange: (sectionId: string, oldId: string, replacement: EnrollmentFormQuestion) => void;
}): ReactElement {
  const addedTitleId = useRef<string | null>(null);

  const addButtonRef = useRef<HTMLButtonElement>(null);

  const active = definition.sections.find((section) => section.id === selected) ?? definition.sections[0];

  const index = definition.sections.findIndex((section) => section.id === active?.id);

  const count = definition.sections.reduce((sum, section) => sum + section.questions.length, 0);

  const available = (Object.keys(ENROLLMENT_NATIVE_LABELS) as EnrollmentFormNativeBlock[]).filter(
    (block) =>
      !definition.sections.some((section) => section.nativeBlock === block) &&
      !(block === "PREFERENCES" && definition.sections.some((section) => section.nativeBlock === "PREFERRED_SHIFT")) &&
      !(block === "PREFERRED_SHIFT" && definition.sections.some((section) => section.nativeBlock === "PREFERENCES")),
  );

  function add(block: EnrollmentFormNativeBlock | null) {
    const section = newEnrollmentSection(block);

    addedTitleId.current = available.length ? `section-${section.id}` : null;

    onChange({ ...definition, sections: [...definition.sections, section] });
    onSelect(section.id);
  }

  const addButton = (
    <Button
      ref={addButtonRef}
      type="button"
      variant="ghost"
      size="lg"
      className="h-auto min-h-14 w-full rounded-none border-0 py-3 focus-visible:ring-inset"
      disabled={disabled || definition.sections.length >= 40}
      onClick={available.length ? undefined : () => add(null)}
    >
      Agregar sección
    </Button>
  );

  return (
    <div className="grid min-w-0 @4xl/page-shell:grid-cols-[15rem_minmax(0,1fr)]">
      <aside
        className="flex min-w-0 flex-col gap-4 border-b p-4 sm:p-5 @4xl/page-shell:overflow-hidden @4xl/page-shell:rounded-bl-xl @4xl/page-shell:border-r @4xl/page-shell:border-b-0"
        aria-label="Secciones del formulario"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Secciones</h3>
          <span className="text-muted-foreground text-sm" aria-label={`${definition.sections.length} secciones`}>
            {definition.sections.length}
          </span>
        </div>
        <div className="@4xl/page-shell:hidden">
          <Select value={active?.id ?? ""} onValueChange={onSelect}>
            <SelectTrigger aria-label="Sección a editar" className="w-full">
              <SelectValue placeholder="Elegí una sección" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {definition.sections.map((section, position) => (
                  <SelectItem key={section.id} value={section.id} className="px-2.5 py-1.5">
                    <span className="text-muted-foreground w-4 shrink-0 text-xs tabular-nums">{position + 1}</span>
                    {section.title || "Sin título"}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <nav className="hidden space-y-1 @4xl/page-shell:block" aria-label="Elegir sección">
          {definition.sections.map((section, position) => (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              key={section.id}
              aria-current={active?.id === section.id ? "true" : undefined}
              onClick={() => onSelect(section.id)}
              className={cn(
                "h-auto min-h-9 w-full justify-start gap-3 px-3 py-2.5 text-left whitespace-normal transition-none",
                active?.id === section.id && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/10 font-medium",
              )}
            >
              <span className="text-muted-foreground w-4 shrink-0 text-xs tabular-nums">{position + 1}</span>
              <span className="min-w-0 flex-1 break-words">{section.title || "Sin título"}</span>
              {enrollmentBlockLocked(section.nativeBlock) ? <LockKeyholeIcon className="size-3.5 shrink-0" aria-label="Sección esencial" /> : null}
            </Button>
          ))}
        </nav>
        {!readOnly ? (
          <div className="-mx-4 mt-auto -mb-4 shrink-0 border-t sm:-mx-5 sm:-mb-5">
            {available.length ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>{addButton}</DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-64 p-1.5"
                  onCloseAutoFocus={(event) => {
                    const input = addedTitleId.current ? document.getElementById(addedTitleId.current) : null;

                    if (addedTitleId.current) {
                      event.preventDefault();
                      (input ?? addButtonRef.current)?.focus();
                    }

                    addedTitleId.current = null;
                  }}
                >
                  <DropdownMenuItem className="px-2.5 py-1.5" onSelect={() => add(null)}>
                    Sección con preguntas propias
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Bloques de Bemol</DropdownMenuLabel>
                  {available.map((block) => (
                    <DropdownMenuItem className="px-2.5 py-1.5" key={block} onSelect={() => add(block)}>
                      {ENROLLMENT_NATIVE_LABELS[block]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              addButton
            )}
          </div>
        ) : null}
      </aside>
      <section className="flex min-w-0 flex-col px-4 pt-3 pb-4 sm:px-5 sm:pb-5 md:px-6 md:pb-6" aria-label="Edición de la sección">
        {active ? (
          <EnrollmentFormSectionEditor
            key={active.id}
            section={active}
            selectedQuestion={selectedQuestion}
            onSelectQuestion={onSelectQuestion}
            index={index}
            total={definition.sections.length}
            questionCount={count}
            availableBlocks={available}
            disabled={disabled}
            readOnly={readOnly}
            onChange={(replacement) =>
              onChange({ ...definition, sections: definition.sections.map((section) => (section.id === active.id ? replacement : section)) })
            }
            onMove={(delta) => onChange({ ...definition, sections: moveEnrollmentItem(definition.sections, index, delta) })}
            onRemove={() => {
              onChange({ ...definition, sections: definition.sections.filter((section) => section.id !== active.id) });
              onSelect(definition.sections[index + 1]?.id ?? definition.sections[index - 1]?.id);
            }}
            onQuestionIdChange={(oldId, replacement) => onQuestionIdChange(active.id, oldId, replacement)}
          />
        ) : (
          <p className="text-muted-foreground py-12 text-center">Agregá una sección para empezar a construir el formulario.</p>
        )}
      </section>
    </div>
  );
}

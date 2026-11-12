import type { ReactElement } from "react";

import { InfoIcon, TextCursorInputIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@common/components/ui/popover";

import type { EnrollmentFormNativeBlock } from "@features/enrollment-forms/types/enrollment-form-native-block.types";

const CONTENT: Record<EnrollmentFormNativeBlock, { fields: [name: string, details: string, condition?: string][] }> = {
  PERSONAL_DATA: {
    fields: [
      ["Nombre", "Texto corto · Obligatoria"],
      ["Apellido", "Texto corto · Obligatoria"],
      ["Documento Nacional de Identidad", "Texto numérico · Obligatoria"],
      ["Fecha de nacimiento", "Fecha · Obligatoria"],
      ["Nacionalidad", "País · Obligatoria"],
      ["Teléfono de contacto", "Teléfono · Obligatoria"],
      ["Correo electrónico", "Correo electrónico · Condicional", "Obligatorio para personas adultas que se inscriben por cuenta propia."],
    ],
  },
  RESPONSIBLE: {
    fields: [
      ["Nombre y Apellido del Responsable", "Texto corto · Obligatoria"],
      ["DNI del Responsable", "Texto numérico · Obligatoria"],
      ["Teléfono del Responsable", "Teléfono · Obligatoria"],
      ["Correo electrónico", "Correo electrónico · Opcional"],
      ["Ocupación / Profesión", "Texto corto · Opcional"],
      ["Nivel de Instrucción", "Una opción · Opcional"],
    ],
  },
  ACADEMIC_SELECTION: {
    fields: [
      ["Cursos a cursar", "Varias opciones · Obligatoria", "Las opciones dependen del trayecto, el ciclo y las correlatividades de la persona."],
      ["Elegí tu instrumento", "Una opción · Condicional", "Obligatorio para cada curso instrumental seleccionado."],
    ],
  },
  DOCUMENTATION: {
    fields: [
      [
        "Archivo del documento",
        "Archivo · Según el requisito",
        "Se repite con el nombre de cada documento requerido. Los formatos y la exigencia se definen en Documentación.",
      ],
    ],
  },
  SCHOOLING: {
    fields: [
      ["¿Actualmente asistís a una institución educativa?", "Sí o no · Obligatoria"],
      ["Nivel educativo actual / Máximo nivel alcanzado", "Una opción · Obligatoria", "El título cambia según si la persona estudia actualmente."],
      [
        "Institución educativa actual / Última institución educativa",
        "Texto corto · Condicional",
        "Obligatoria si estudia actualmente; opcional si ya no estudia. No se muestra si eligió «Sin escolarización».",
      ],
      ["Sala, grado o año de cursado", "Texto corto · Opcional", "Solo si estudia actualmente y eligió un nivel educativo."],
      ["¿Completaste ese nivel?", "Sí o no · Condicional", "Obligatoria si no estudia y el nivel no es «Sin escolarización» ni «Secundario»."],
      ["¿Completaste el secundario?", "Sí o no · Condicional", "Obligatoria en nivel secundario, superior no universitario o universitario."],
      ["Título secundario obtenido", "Texto corto · Opcional", "Solo si completó el secundario."],
    ],
  },
  HEALTH_INCLUSION: {
    fields: [
      ["¿Requiere ajustes razonables o apoyos específicos?", "Sí o no · Opcional"],
      ["Detalle de los apoyos requeridos", "Texto largo · Condicional", "Obligatoria si requiere ajustes razonables o apoyos específicos."],
    ],
  },
  PREFERENCES: {
    fields: [
      ["Turno de preferencia", "Una opción · Obligatoria"],
      ["Autorización para uso de imagen", "Sí o no · Opcional"],
      ["¿Sos estudiante reingresante?", "Sí o no · Opcional"],
      ["Docente con quien cursaste previamente", "Texto corto · Condicional", "Obligatoria si la persona es reingresante."],
    ],
  },
  PREFERRED_SHIFT: {
    fields: [["Turno de preferencia", "Una opción · Obligatoria"]],
  },
};

export function EnrollmentFormNativePreview({ block }: { block: EnrollmentFormNativeBlock }): ReactElement {
  const content = CONTENT[block];

  return (
    <div className="space-y-4">
      <ul className="divide-y" aria-label="Campos del bloque, solo lectura">
        {content.fields.map(([name, details, condition]) => (
          <li key={name} className="min-w-0 py-1">
            <div className="flex min-h-11 min-w-0 items-center gap-2 py-0.5 @3xl/page-shell:py-2">
              <span
                className="bg-primary/10 text-primary hidden size-7 shrink-0 items-center justify-center rounded-lg @3xl/page-shell:flex"
                aria-hidden="true"
              >
                <TextCursorInputIcon className="size-4.5" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1 @3xl/page-shell:flex-row @3xl/page-shell:items-center @3xl/page-shell:justify-between @3xl/page-shell:gap-4">
                <div className="flex min-w-0 items-center gap-1">
                  <span className="min-w-0 text-sm font-medium break-words">{name}</span>
                  {condition ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground -my-1"
                          aria-label={`Información sobre ${name}`}
                        >
                          <InfoIcon aria-hidden="true" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        sideOffset={6}
                        collisionPadding={16}
                        aria-label={`Información sobre ${name}`}
                        className="max-h-[var(--radix-popover-content-available-height)] w-80 max-w-[calc(100vw-2rem)] gap-3 overflow-y-auto p-4"
                      >
                        <PopoverHeader>
                          <PopoverTitle>{name}</PopoverTitle>
                        </PopoverHeader>
                        <p className="text-sm leading-relaxed break-words">{condition}</p>
                      </PopoverContent>
                    </Popover>
                  ) : null}
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">{details}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

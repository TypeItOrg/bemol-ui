export function operationFieldValue(key: string, value: unknown): string | undefined {
  if (value === null) {
    return "Sin especificar";
  }

  if (typeof value === "boolean") {
    if (key === "active") {
      return value ? "Activo" : "Inactivo";
    }

    return value ? "Sí" : "No";
  }

  if (typeof value === "number") {
    if (key === "year") {
      return String(value);
    }

    return key === "size" ? `${value.toLocaleString("es-AR")} bytes` : value.toLocaleString("es-AR");
  }

  if (Array.isArray(value)) {
    const values = value.filter((item): item is string => typeof item === "string");

    return values.length > 0 ? values.join(", ") : "Ninguno";
  }

  if (typeof value === "string") {
    return value;
  }

  return undefined;
}

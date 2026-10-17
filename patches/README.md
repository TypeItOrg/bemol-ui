# Parche de seguridad de braces

`braces@3.0.3` está afectado por [CVE-2026-93687 / GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Al aplicar este parche todavía no existe una versión oficial corregida.

El parche registrado en `pnpm-workspace.yaml` limita a 100 niveles la anidación combinada de llaves y paréntesis, la recursión de los recorridos de AST y los recorridos de sus enlaces `parent`. Los patrones excesivos se rechazan explícitamente antes de agotar la pila. Los delimitadores escapados, entre comillas o dentro de clases de caracteres conservan su comportamiento.

Se revisó tomando como referencia el [PR upstream #87](https://github.com/micromatch/braces/pull/87), commit `d44b9b1`, aún no integrado. La adaptación local mantiene un límite fijo, sin agregar opciones nuevas. No pretende limitar todas las expansiones ni validar cualquier AST malformado.

`pnpm install --frozen-lockfile` aplica el parche también en CI y Docker. Los tests de `test/security/braces.test.ts` verifican el paquete que resuelven sus consumidores reales, no la copia temporal usada para producir el parche.

El paquete conserva la versión `3.0.3`: pnpm audit y Dependabot seguirán informando la alerta por versión. No se agregó ninguna exclusión ni se descartó la alerta. Cuando upstream publique una corrección oficial, actualizar la dependencia y retirar el parche después de verificar estas regresiones.

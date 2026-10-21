# Despliegue

Este repositorio construye, valida y publica la imagen de `bemol-ui`. La topología, Compose, variables privadas y operación de staging viven en el repositorio de infraestructura, llamado `bemol-infra`.

> **Publicación y migración pendientes:** los repositorios remotos ya fueron
> renombrados a `bemol-ui`, `bemol-api` y `bemol-infra`. Falta publicar la imagen
> `ghcr.io/typeitorg/bemol-ui` con permisos de lectura para Dokploy antes de
> desplegar. Migrar además las referencias del entorno y sus recursos persistentes
> según `bemol-infra/docs/RENOMBRE-BEMOL.md`; este cambio de código no ejecuta
> esa migración ni demuestra que la nueva imagen esté publicada.

## CI y despliegue a staging

Hay dos workflows:

- **CI**, en [`.github/workflows/ci.yaml`](../../.github/workflows/ci.yaml): formato, lint, tipos, tests y build. Se ejecuta para pull requests hacia `develop`, `staging` y `main`, y para pushes a `develop`/`main`. No publica imágenes ni recibe secrets de Dokploy.
- **Deploy staging**, en [`.github/workflows/deploy-staging.yaml`](../../.github/workflows/deploy-staging.yaml): sólo por push a `staging`. Primero llama al CI reutilizable del mismo commit con `workflow_call`, sin duplicarlo; si pasa, publica `ghcr.io/typeitorg/bemol-ui:sha-<commit>` y `:staging`, y solicita el despliegue.

El checkout, las pruebas y el tag SHA corresponden al mismo `github.sha`. La llamada conserva la referencia de staging y sus restricciones de Environment; no usa `workflow_run`, que ejecutaría desde la rama por defecto. `develop` se ejecuta localmente y `main` sólo valida: ninguno publica imágenes ni despliega.

Los runners se fijan en `ubuntu-24.04`. Los grupos de concurrencia de CI y deploy son distintos, para cancelar versiones anteriores sin que el caller cancele su propio CI.

El job `deploy-staging` usa el GitHub Environment `staging` y sus secrets `DOKPLOY_URL`, `DOKPLOY_API_KEY` y `DOKPLOY_STAGING_COMPOSE_ID`; no entra por SSH. Dokploy descarga las imágenes y ejecuta el Compose de staging, conservando los volúmenes existentes.

Una solicitud exitosa no demuestra que el despliegue asíncrono haya terminado ni que los servicios estén saludables. No hay rollback automático de ese job. Consultar la guía de staging con Dokploy (`bemol-infra/docs/DOKPLOY-STAGING.md`) para verificar las imágenes ejecutadas y volver a una versión anterior.

## Responsabilidades de este repositorio

- `Dockerfile`: construcción y runtime de la imagen.
- `compose.yaml`: desarrollo local.
- `.env.example`: configuración local.
- `.github/workflows/ci.yaml`: validaciones reutilizables.
- `.github/workflows/deploy-staging.yaml`: publicación y solicitud de despliegue, después de CI.

No deben agregarse aquí configuraciones del proxy ni Compose de ambientes compartidos.

## Producción

Todavía no existe un ambiente productivo. No se conserva un workflow de despliegue a producción: se definirá cuando se prepare ese ambiente. Un push a `main` sólo ejecuta CI, sin publicar imágenes ni desplegar producción.

La configuración futura de infraestructura permanece en `bemol-infra`; retirarla no forma parte de esta limpieza de workflows.

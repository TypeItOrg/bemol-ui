# Despliegue

Este repositorio construye, valida y publica la imagen de `boero-ui`. La topología, Compose, variables privadas y operación de staging viven en [`boero-infra`](https://github.com/TypeItOrg/boero-infra).

## CI y despliegue a staging

El workflow [`.github/workflows/ci-staging.yaml`](../../.github/workflows/ci-staging.yaml) aparece en GitHub Actions como **CI and staging deployment**.

- Los pull requests hacia `develop`, `staging` y `main` ejecutan formato, lint, tipos, tests y build.
- Los pushes a esas ramas ejecutan las mismas validaciones. `develop` se ejecuta localmente: no publica imágenes ni despliega un ambiente remoto.
- Sólo un push a `staging`, después de las validaciones, publica `ghcr.io/typeitorg/boero-ui:sha-<commit>` y `:staging`, y solicita el despliegue a Dokploy. `main` tampoco publica imágenes ni despliega.

El job `deploy-staging` usa el GitHub Environment `staging` y sus secrets `DOKPLOY_URL`, `DOKPLOY_API_KEY` y `DOKPLOY_STAGING_COMPOSE_ID`; no entra por SSH. Dokploy descarga las imágenes y ejecuta el Compose de staging, conservando los volúmenes existentes.

Una solicitud exitosa no demuestra que el despliegue asíncrono haya terminado ni que los servicios estén saludables. No hay rollback automático de ese job. Consultar la [guía de staging con Dokploy](https://github.com/TypeItOrg/boero-infra/blob/main/docs/DOKPLOY-STAGING.md) para verificar las imágenes ejecutadas y volver a una versión anterior.

## Responsabilidades de este repositorio

- `Dockerfile`: construcción y runtime de la imagen.
- `compose.yaml`: desarrollo local.
- `.env.example`: configuración local.
- `.github/workflows/ci-staging.yaml`: validación, publicación y solicitud de despliegue a staging.

No deben agregarse aquí configuraciones del proxy ni Compose de ambientes compartidos.

## Producción

Todavía no existe un ambiente productivo. No se conserva un workflow de despliegue a producción: se definirá cuando se prepare ese ambiente. Un push a `main` sólo ejecuta CI, sin publicar imágenes ni desplegar producción.

La configuración futura de infraestructura permanece en `boero-infra`; retirarla no forma parte de esta limpieza de workflows.

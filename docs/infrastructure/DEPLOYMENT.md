# Despliegue

Este repositorio construye, valida y publica la imagen de `bemol-ui`. La topología, Compose, variables privadas y operación de staging viven en el repositorio de infraestructura, llamado `bemol-infra`. Allí, la rama `staging` corresponde al VPS de staging y `main` queda reservada para producción.

> **VPS migrado a Compose y SSH.** El checkout operativo está en `/opt/bemol-infra`
> y Dokploy fue retirado. La operación se documenta en [`bemol-infra/docs/STAGING.md`](https://github.com/TypeItOrg/bemol-infra/blob/staging/docs/STAGING.md).

## CI y despliegue a staging

Hay dos workflows:

- **CI**, en [`.github/workflows/ci.yaml`](../../.github/workflows/ci.yaml): formato, lint, tipos, tests y build. Se ejecuta para pull requests hacia `develop`, `staging` y `main`, y para pushes a `develop`/`main`. No publica imágenes ni recibe credenciales de despliegue.
- **Deploy staging**, en [`.github/workflows/deploy-staging.yaml`](../../.github/workflows/deploy-staging.yaml): sólo por push a `staging`. Publica `ghcr.io/typeitorg/bemol-ui:sha-<commit>` y `:staging`, y solicita el despliegue. No repite CI ni consulta ejecuciones anteriores.

La protección de `staging` exige que el commit tenga el check `verify` de GitHub Actions aprobado antes de aceptar el push. El checkout y el tag de la imagen usan ese mismo SHA. `develop` y `main` sólo validan: ninguno publica imágenes ni despliega.

Los runners se fijan en `ubuntu-24.04`. Los grupos de concurrencia de CI y deploy son distintos y cancelan ejecuciones anteriores de la misma referencia.

El job `deploy-staging` usa el GitHub Environment `staging` con `DEPLOY_HOST`, `DEPLOY_PORT`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` y `DEPLOY_SSH_KNOWN_HOSTS`. Verifica la clave del host y ejecuta `scripts/deploy-staging.sh` en `/opt/bemol-infra` por SSH.

El script del servidor serializa API/UI, hace pull y aplica la combinación `compose.yaml` + `compose.staging.yaml`, conservando los volúmenes. Las variables `API_VERSION` y `UI_VERSION` del archivo privado `.env.staging` seleccionan tags móviles o SHA; el job espera el resultado y la salud configurada de los contenedores. No hay rollback automático ni reversión de migraciones. La operación manual está en [`bemol-infra/docs/STAGING.md`](https://github.com/TypeItOrg/bemol-infra/blob/staging/docs/STAGING.md).

## Promoción a staging

Una vez aprobado el CI de develop:

```bash
git fetch origin
git switch staging
git rebase origin/develop
git push origin staging
```

Sin commits exclusivos en staging, el rebase conserva el SHA validado. Si genera otro commit o el CI todavía no aprobó, GitHub rechaza el push: no se ejecuta un CI de respaldo en staging.

La regla se configura en GitHub para `staging`, exige `verify` de GitHub Actions y se aplica también a administradores. No exige PR ni permite force pushes o borrar la rama. No quitar esta protección mientras el workflow despliegue sin ejecutar CI.

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

# Integración continua

GitHub Actions verifica los pushes a `develop` y `main`, y los pull requests dirigidos a `develop`, `staging` y `main`. El job `verify` controla formato, lint, tipos, tests y el build de producción.

Staging exige el check `verify` de GitHub Actions antes de aceptar el commit. Su workflow sólo publica y despliega, sin repetir CI. La protección también se aplica a administradores y permite el push directo del mismo SHA aprobado; ver [Promoción a staging](DEPLOYMENT.md#promoción-a-staging).

```mermaid
graph LR
    A[Push develop/main o PR] --> B[📋 Format Check]
    B --> C[🔍 Lint]
    C --> D[📝 Typecheck]
    D --> E[🧪 Tests]
    E --> F[🏗️ Build]
    F --> G[✅ verify aprobado]
    G --> H[Push del mismo commit a staging]
    H --> I[🐳 Publish to GHCR]
    I --> J[SSH: desplegar]
```

## Publicación de imágenes

Los pushes a `staging` publican dos etiquetas de la imagen en **GitHub Container Registry**:

```
ghcr.io/typeitorg/bemol-ui:sha-<sha-del-commit>   # Inmutable
ghcr.io/typeitorg/bemol-ui:<rama>                  # Puntero a la última imagen exitosa
```

> [!WARNING]
> Los repositorios remotos ya fueron renombrados a Bemol. La publicación de la
> nueva imagen y la migración de permisos y referencias externas siguen pendientes;
> ver [Despliegue](DEPLOYMENT.md) antes de desplegar.

> [!IMPORTANT]
> Los despliegues **deben usar la etiqueta inmutable** `sha-<sha-del-commit>`. La etiqueta de rama es solamente un puntero conveniente.

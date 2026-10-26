# PWA de Bemol

## Instalación manual

Abrir el sitio con conexión y usar la opción de instalar del navegador. En Chrome/Edge
de escritorio puede aparecer en la barra de direcciones o en el menú. En Android,
buscar «Instalar aplicación» o «Agregar a pantalla de inicio» según el navegador.
En iPhone, usar Compartir → Agregar a pantalla de inicio. La disponibilidad y el
texto exacto dependen del navegador y del sistema operativo; no hay promoción propia.

| Origen                       | Nombre instalado       | Nombre corto           | Inicio   |
| ---------------------------- | ---------------------- | ---------------------- | -------- |
| Subdominio institucional     | Nombre corto - Bemol   | Nombre corto - Bemol   | `/`      |
| Dominio general, área /admin | Administración - Bemol | Administración - Bemol | `/admin` |

El dominio general fuera de `/admin` no publica el enlace al manifiesto ni declara
modo de aplicación Apple. La PWA de plataforma se declara desde el layout común de
`/admin`, incluido su login. Los subdominios institucionales la declaran desde su raíz.
Esto controla dónde ofrecemos nuestra PWA, no las opciones propias del navegador:
algunos permiten instalar cualquier web o crear accesos directos aun sin manifiesto.

El nombre completo y corto de administración son «Administración - Bemol», incluido
el nombre Apple. Las institucionales usan «Nombre corto - Bemol» en ambos y en el nombre Apple,
con el nombre completo como alternativa si no tienen uno corto.

Los títulos visibles siguen estas reglas, también al navegar:

| Contexto                     | Ejemplo de título                                                   |
| ---------------------------- | ------------------------------------------------------------------- |
| PWA institucional con overlay | Usuarios \| Felipe Boero - Bemol                                    |
| Navegador institucional      | Usuarios \| Conservatorio Superior de Música Felipe Boero - Bemol    |
| Administración, overlay o web | Usuarios \| Administración - Bemol                                  |

El manifiesto solicita `window-controls-overlay`, con `standalone` como alternativa.
En escritorios compatibles y con el overlay activo, una barra propia combina los
metadatos `application-title` (pantalla) y `application-name` (nombre instalado).
Es arrastrable, sigue el tema de Bemol y reserva el área de los controles nativos
mediante `env(titlebar-area-*)`. El texto largo se recorta, sin invadir esos controles.
Al cambiar de tamaño o desactivar el overlay, CSS actualiza el espacio reservado.

El título HTML en modo instalado contiene solo la pantalla, por ejemplo «Usuarios».
Así, cuando el navegador usa su barra estándar o muestra la ventana en el selector
de aplicaciones, puede anteponer el nombre instalado sin duplicarlo:
«Felipe Boero - Bemol - Usuarios» o «Administración - Bemol - Usuarios».
Ese prefijo y su orden pertenecen al navegador. Fuera de la PWA se conserva el título
web con el nombre completo de la institución; al salir del modo instalado se restaura.

El overlay no se activa en móviles ni en navegadores sin soporte. El usuario puede
desactivarlo desde los controles de la PWA. Las instalaciones existentes deben recibir
el manifiesto actualizado; su renovación depende del navegador. La barra nativa y su
arrastre requieren una comprobación en la PWA instalada, no solo emulación de escritorio.

Referencia: [Window Controls Overlay en Microsoft Edge](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/window-controls-overlay).

Las instalaciones de instituciones diferentes siguen separadas por origen aunque
compartan ícono. El dispositivo puede recortar visualmente el nombre.

El manifiesto se resuelve desde el Host real y no se comparte entre instituciones.
El dominio general instala la aplicación de plataforma desde `/admin`; el login
institucional con selector se conserva para pruebas, sin declarar una PWA. No se persisten rutas,
tokens ni parámetros de recuperación en el manifiesto. La autenticación existente
controla qué puede abrir cada usuario; instalar no concede acceso ni conserva una sesión.

El ícono instalado y el ícono Apple son de Bemol; los favicons institucionales del
navegador se conservan. Los PNG derivan de `public/brand/favicon.svg`. Las variantes
`any` de 192 y 512 píxeles usan el símbolo recortado a su contenido, sin fondo ni
padding adicional, para evitar un cuadrado claro dentro del marco del escritorio.
Apple conserva fondo `#faf9f6` a 180 píxeles con símbolo al 78%; la variante maskable
de 512 usa el mismo fondo y símbolo al 56% para respetar la zona segura. No requieren
un generador durante el build. Las URL versionadas del manifiesto permiten detectar
los nuevos PNG sin cambiar la identidad de la aplicación instalada; su actualización
efectiva depende del navegador y del sistema operativo.

## Conexión y actualizaciones

Se requiere HTTPS válido (o un origen local confiable para desarrollo). El worker
solo se registra con `NODE_ENV=production`, navegador compatible y contexto seguro;
para comprobarlo localmente se necesita una compilación de producción, no `next dev`.

Tras una primera carga online correcta, el worker guarda únicamente `/offline.html`,
autocontenido y sin datos del usuario. Ante un fallo de red en una navegación HTML
se muestra el aviso y «Reintentar» vuelve a solicitar la URL original. Si el navegador
borra el almacenamiento local o la preparación inicial falla, ese fallback puede
no estar disponible. Los errores HTTP del servidor conservan su respuesta original.

API, Server Actions, RSC, recursos y adjuntos quedan fuera de la interceptación.
No se guardan respuestas privadas ni se agregan colas de escritura o sincronización.
No se modifican las políticas HTTP de caché ya existentes en la aplicación.

Con la aplicación abierta, el aviso de desconexión no sustituye formularios ni fuerza
recargas. La señal de conectividad del navegador es orientativa: no asegura que el
servidor sea accesible. Reconectar no reenvía operaciones ni restaura datos tras cerrar
la aplicación. No se ofrece guardado offline de formularios.

El worker no fuerza activación de actualizaciones sobre pestañas abiertas ni recarga
páginas. Al activarse una versión nueva, solo elimina cachés propias antiguas con el
prefijo `bemol-pwa-offline-`. Incrementar su versión cuando cambie el fallback. Los
cambios de nombre o ícono pueden tardar en reflejarse según el dispositivo.

El color de la barra superior se inicializa después de resolver el tema, antes del
contenido, y solo se sincroniza cuando cambia el tema. El metadato `theme-color`
queda fuera del viewport administrado por Next.js para que navegar no lo reemplace
por un color claro y produzca un destello. El manifiesto declara un `theme_color`
oscuro fijo (`#10080a`) para que Chrome para Android pueda usarlo como fondo de la
barra inferior del sistema, tanto en tema claro como oscuro. El color claro de los
botones lo decide Android por contraste; la web no controla esos botones directamente.
El metadato de la página sigue sincronizando la barra superior con el tema elegido.
El manifiesto conserva `background_color` para el arranque.

El resultado depende de la versión de Chrome y Android, del fabricante y del modo
de navegación (botones o gestos); algunas versiones pueden ignorar el color solicitado.
Validar ambos temas en la PWA instalada tras actualizar su manifiesto. No se acredita
la apariencia de las barras del sistema mediante emulación de pantalla en escritorio.

Referencia: [implementación de Chromium para el color de navegación de PWAs instaladas](https://chromium.googlesource.com/chromium/src/+/0a6ab4f0e2ce17e572b05400ae6eacd7fc5389f0%5E%21/).

## Aceptación y producción

Comprobar por separado los hosts general y de dos instituciones: manifiesto sin caché,
nombre, destino, PNG e identidad independiente. Probar instalación manual y apertura
standalone; abrir sin red después de preparar el worker, reintentar, y desconectar y
reconectar con un formulario abierto sin perder sus valores. Revisar que Cache Storage
contenga solo el fallback y que API/escrituras no reciban HTML offline. Comprobar también
la actualización del worker manteniendo una pestaña abierta.

La emulación móvil no sustituye la aceptación en Android y iPhone físicos. Registrar
qué dispositivo/navegador y qué escenarios se comprobaron; no afirmar instalación real
por haber validado el manifiesto o el build.

No hacen falta variables nuevas ni cambios de backend o Nginx. Se reutilizan los dominios
y certificados de cada ambiente; staging y producción tienen instalaciones separadas.
El push a `staging` activa el despliegue existente y requiere autorización explícita.

### Evidencia local del 2026-10-23

- Build de producción, TypeScript, ESLint y formato correctos; 64 tests focalizados
  en 8 suites, incluyendo resolución institucional y proxy existentes.
- HTTP local: manifiesto de plataforma y dos instituciones ficticias independientes,
  host inexistente `404`, PNG válidos y worker con MIME/headers sin caché correctos.
- Navegador integrado sobre la compilación de producción: metadatos de plataforma e
  institución, sin controles de instalación agregados. Al detener el servidor local,
  ambos orígenes mostraron el fallback en la URL original; «Reintentar» recuperó el
  acceso institucional al restablecerlo. Revisión a 390 × 844 y 1280 × 800 píxeles.
- Banner, conservación de valores y limpieza de versiones de caché comprobados con
  tests; no se acreditan como pruebas de desconexión física o actualización real.
- Ajuste de nombre y acceso: 24 tests focalizados en 4 suites, tipos y lint correctos.
  Compilación final con `next build --webpack`; Turbopack quedó bloqueado por un
  permiso del entorno al abrir su puerto, incluso fuera del sandbox. No se cambió
  la configuración del proyecto para evitarlo.
- Navegador sobre esa compilación: login general sin manifiesto ni modo Apple;
  `/admin` redirige a su login con manifiesto y nombre Apple Bemol; subdominio
  institucional con los mismos metadatos instalables y título web institucional.
  HTTP local confirmó nombre Bemol e inicios correctos para plataforma y dos instituciones.
- Pendientes: instalación manual desde un navegador con esa opción, apertura de la
  aplicación instalada en modo standalone, Android/iPhone físicos y renovación del
  worker con clientes abiertos. El navegador integrado no expone esos controles.

No se usaron cuentas o datos reales, no se probó autenticación y no se desplegó.

## Rollback

Revertir la imagen o borrar `sw.js` no desinstala workers ya registrados. Para retirar
esta funcionalidad, servir temporalmente un worker neutralizador **en `/sw.js`**, con
los mismos headers sin caché, mientras se elimina el registro desde la aplicación.
El neutralizador no debe manejar `fetch`; debe activarse, borrar solo cachés cuyo nombre
empiece con `bemol-pwa-offline-` y ejecutar `self.registration.unregister()`.

Si se necesita reemplazar inmediatamente un worker anterior, el neutralizador puede
usar `self.skipWaiting()` en instalación. No debe recargar clientes ni borrar cookies,
sesiones u otras cachés. Mantenerlo publicado para que dispositivos que vuelvan más
tarde puedan recibirlo; no basta con un deploy breve. Verificar la actualización y
desregistro antes de dar el rollback por terminado. Ningún worker puede retirarse
remotamente de un dispositivo que permanece sin conexión.

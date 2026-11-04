# Despliegue de Talos Code

Proyecto Vercel: `nicolas-a826/talos-code`. Framework: Next.js; Node.js 24.x.

## Entornos

| Destino Vercel | Uso | NEXT_PUBLIC_APP_ENV | Base de datos |
| --- | --- | --- | --- |
| development | `pnpm dev` local | development | Desarrollo |
| preview | `pnpm deploy:dev` y ramas/PRs | preview | Desarrollo, aislada de producción |
| production | `pnpm deploy:prod` y rama de producción | production | Producción |

`NEXT_PUBLIC_APP_ENV` es público. Nunca usar `NEXT_PUBLIC_` ni `VITE_` para credenciales.
Las variables de cada destino se configuran explícitamente: Preview no hereda Development.
La aplicación actual no usa DATABASE_URL; queda preparada para el futuro backend.

## Comandos ejecutados

```bash
vercel --version
vercel whoami --format json
vercel project inspect --non-interactive
vercel project ls --scope nicolas-a826 --non-interactive
vercel link --yes --project talos-code --scope nicolas-a826
vercel project inspect --non-interactive --json
vercel project update talos-code --framework nextjs --node-version 24.x --build-command "pnpm run build" --dev-command "pnpm run dev:next" --install-command "pnpm install --frozen-lockfile" --scope nicolas-a826 --yes
vercel env add NEXT_PUBLIC_APP_ENV --environment development --value development --yes --scope nicolas-a826
vercel env add NEXT_PUBLIC_APP_ENV --environment preview --value preview --yes --scope nicolas-a826
vercel env add NEXT_PUBLIC_APP_ENV --environment production --value production --yes --scope nicolas-a826
```

La CLI ya estaba instalada; no fue necesario `pnpm add -g vercel`.
La CLI 65.11.0 usa `--environment`; consultar `vercel env add --help`.

## Introducir DATABASE_URL después

En Bash o Git Bash, desde la raíz del repositorio:

```bash
VERCEL_SCOPE=nicolas-a826 bash scripts/setup-vercel-databases.sh
```

El script verifica proyecto/equipo, solicita ambas URLs sin mostrarlas, comprueba
que host/puerto/base no coincidan e introduce cada valor por stdin. No crea bases
de datos ni confirma su conectividad. Usar instancias distintas y credenciales
independientes. Preview usa la instancia de desarrollo. Las operaciones son
secuenciales: si falla una, revisar `vercel env ls` antes de repetir. El script
no sobrescribe variables existentes; usar `vercel env update` para rotarlas.
Aplicar el mismo patrón a otras APIs: stdin con `--environment` explícito y
credenciales separadas para Production; `--sensitive` en Preview y Production.

```bash
vercel env pull .env.local --environment development
pnpm dev
pnpm deploy:dev
# Desde master, cuando se quiera publicar:
pnpm deploy:prod
```

`.env*` y `.vercel/` están excluidos de Git. La CLI 65.11.0 rechaza literalmente
`"dev": "vercel dev"` antes de leer devCommand. Por compatibilidad, `dev` delega
en `pnpm run dev:vercel`, cuyo comando es `vercel dev`. El comando interno de
Vercel es `pnpm run dev:next` (`next dev`), evitando recursión. La CLI usa Preview por defecto y Production únicamente con `--prod`;
`deploy:prod` no valida por sí mismo la rama actual.

## Filtro de builds

`vercel.json` ejecuta `scripts/vercel-ignore-build.mjs`. Compara contra
`VERCEL_GIT_PREVIOUS_SHA` (o `HEAD^` cuando falta). Omite solo cuando todos los
cambios son `.md`, imágenes o archivos locales de editor/agente. Código,
lockfiles, `next.config.*`, `vercel.json` y scripts de despliegue siempre disparan
build. Sin historial válido se hace build. Una actualización solo de imágenes
no llegará a la web hasta el siguiente build de código o un despliegue forzado.

Para nuevos checkouts: ejecutar `vercel link --yes --project talos-code --scope
nicolas-a826` y verificar con `vercel project inspect --non-interactive` antes de
modificar variables o desplegar. No subir archivos `.vercel` para compartir el enlace.

## Verificación ejecutada

```bash
vercel env pull .env.local --environment development --yes --scope nicolas-a826
vercel env ls
pnpm run build
node --test scripts/vercel-ignore-build.test.mjs
```

## Limitación local detectada en Windows

La prueba `pnpm dev --listen 127.0.0.1:3100` supera la comprobación de recursión,
pero Vercel CLI no pudo instalar sus builders en su caché: Windows devolvió
`EPERM` al crear enlaces simbólicos. El servidor de Vercel no llegó a arrancar.
No se cambiaron permisos ni ajustes del sistema. Para usar `vercel dev`, ejecutar
una terminal con permiso para crear enlaces simbólicos o habilitar el modo de
desarrollador de Windows de forma deliberada. Mientras tanto, después de descargar
solo variables de Development, se puede usar el servidor Next.js directamente:

```bash
vercel env pull .env.local --environment development --yes --scope nicolas-a826
pnpm dev:next
```

Este servidor alternativo no emula todos los servicios de Vercel.

## Reglas de Ahorro de Tokens
- Usa siempre parches mínimos y quirúrgicos (`surgical-patch`); nunca reescribas archivos completos si solo cambias unas líneas.
- No leas archivos enteros de más de 150 líneas de golpe; inspecciona primero imports, firmas o busca el símbolo exacto.
- Ignora y nunca leas `node_modules/`, `.next/`, `dist/`, `pnpm-lock.yaml` ni archivos generados.
- Responde de forma ultra directa, técnica y sin relleno conversacional.

## Dirección Visual y Animaciones (Estilo MotionSites)
- Evita layouts genéricos: prioriza jerarquía tipográfica editorial marcada, composiciones asimétricas, alto contraste y estética dark tecnológica limpia.
- Scroll suave con `lenis` cuando corresponda.
- Animaciones de entrada con `motion/react` usando curvas fluidas `[0.22, 1, 0.36, 1]` (easeOutQuint), apariciones escalonadas (*stagger*) por línea o tarjeta, y `viewport={{ once: true, amount: 0.2 }}`.
- Anima exclusivamente propiedades aceleradas por GPU (`transform`, `opacity`, `clip-path`). Nunca animes `top`, `left`, `width` ni `height`.
- En escenas 3D (`@react-three/fiber` / Three.js), optimiza geometrías, usa `InstancedMesh` cuando haya repeticiones y limpia recursos al desmontar.

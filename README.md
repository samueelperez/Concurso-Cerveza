# 🍺 La Gran Cata — Concurso de cerveza entre amigos

Webapp móvil para hacer una cata de cervezas a ciegas: cada amigo elige su nombre
(sin login), puntúa cada cerveza del 1 al 10 viendo solo su número, y al final el
organizador revela los nombres reales y publica el podio.

**Stack:** Next.js (App Router) · Neon (Postgres serverless) · shadcn/ui · GSAP · lucide-react · Tailwind CSS v4

## Cómo funciona

| Rol | Qué ve / qué hace |
|---|---|
| **Amigo** (`/`) | Elige su nombre de una lista predefinida (se recuerda en su móvil), ve las cervezas como `Nº 1, Nº 2…` y puntúa cada una del 1 al 10. Puede cambiar su nota mientras la votación siga abierta. |
| **Admin** (`/admin`) | Entra con la contraseña `admin123*`. Vincula cada número con el nombre real de la cerveza, gestiona participantes, ve el progreso en directo, **bloquea la votación** (se revelan los nombres en todos los móviles) y **publica los resultados** (todos ven el dashboard final con podio, ranking y estadísticas). |

Los nombres reales **nunca viajan al navegador** mientras la votación está abierta.
Las pantallas se actualizan solas (polling) cuando el admin cambia el estado.

## Puesta en marcha

1. Crea una base de datos gratuita en [neon.tech](https://neon.tech) y copia la cadena de conexión.
2. ```bash
   cp .env.example .env.local   # y pega tu DATABASE_URL
   npm install
   npm run dev
   ```
3. Abre `http://localhost:3000`. Las tablas y los datos iniciales (8 participantes,
   6 cervezas) se crean solos en el primer arranque; edítalos desde `/admin`.

### Deploy en Vercel

Importa el repo en Vercel y añade la variable de entorno `DATABASE_URL`. Nada más.

### Desarrollo sin Neon

Si `DATABASE_URL` apunta a `localhost`, la app usa automáticamente el driver `pg`
contra un Postgres local normal — útil para trastear sin conexión.

## Estados del concurso

`Votación abierta` → `Votación bloqueada` (números → nombres reales) → `Resultados publicados` (dashboard final). El admin puede moverse entre estados en cualquier momento desde `/admin`.

# SIGMAVE — Backend

API REST de SIGMAVE (Node.js + Express + PostgreSQL/Supabase).

La instalación, la base de datos local (Supabase CLI), las variables de
entorno y la ejecución con Docker están documentadas en el
[README principal](../README.md) (sección "Instalación y ejecución").

Resumen rápido (desde esta carpeta):

```bash
npm ci
npx supabase start
cp .env.example .env    # y completar JWT_SECRET
npm run dev             # http://localhost:3000
```

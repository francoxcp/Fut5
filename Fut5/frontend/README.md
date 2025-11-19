# Fut5 Frontend (scaffold)

Pequeño scaffold React + Vite para la app de reservas Fut5.

Prerequisitos:
- Node.js 18+ y npm (o pnpm/yarn)

Variables de entorno (crear `.env` o usar `.env.local`):

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Comandos útiles:

```bash
cd frontend
npm install
npm run dev
```

Siguientes pasos recomendados:
- Conectar `src/supabase/client.js` con tus credenciales.
- Implementar llamadas a la función `create_pending_reservation` vía RPC o insert directo.
- Implementar autenticación con Supabase Auth (teléfono/email) en la UI.
- Añadir rutas y control de roles para admin/usuario.

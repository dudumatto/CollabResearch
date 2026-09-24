# Deploy do CollabResearch

Este projeto usa:

- Vercel para o frontend React em `web/`.
- Render para o backend Spring Boot em `backend/tcc-backend/`.
- Supabase para PostgreSQL e Storage.

## Supabase

1. Crie um projeto no Supabase.
2. Em SQL Editor, execute `supabase/storage_setup.sql`.
3. Em Database, use o pooler PostgreSQL para preencher as variaveis do backend:

```env
DB_URL=jdbc:postgresql://YOUR_SUPABASE_POOLER_HOST:5432/postgres?sslmode=require
DB_USER=postgres.YOUR_PROJECT_REF
DB_PASSWORD=your_database_password
DB_SSL_MODE=require
```

4. Em API Settings, copie:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Use `SUPABASE_SERVICE_ROLE_KEY` somente no Render/backend.

## Render

O Blueprint principal fica em `render.yaml`, na raiz do repositorio.

1. No Render, crie um Blueprint a partir do repositorio.
2. Confirme o servico `collabresearch-backend`.
3. Preencha as variaveis marcadas com `sync: false`:

```env
DB_URL=
DB_USER=
DB_PASSWORD=
JWT_SECRET=
CRON_SECRET=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_CLIENT_ID=
```

4. Depois do deploy, valide:

```text
https://<render-service>.onrender.com/api/health
https://<render-service>.onrender.com/api/health/supabase-storage
```

## Vercel

Configure o projeto Vercel com Root Directory `web`.

O `web/vercel.json` define:

- Framework: Vite.
- Build: `npm run build`.
- Output: `dist`.
- Rewrite SPA sem capturar `/api/*`.
- Cache imutavel para `/assets/*`.

Variaveis do projeto:

```env
VITE_API_URL=https://<render-service>.onrender.com
VITE_BACKEND_URL=https://<render-service>.onrender.com
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_BUCKET=documents
VITE_GOOGLE_CLIENT_ID=your_google_oauth_web_client_id
VITE_GOOGLE_HOSTED_DOMAIN=unicamp.br,cotil.unicamp.br
```

Depois de definir a URL final da Vercel, atualize no Render:

```env
CORS_ALLOWED_ORIGIN_PATTERNS=http://localhost:*,http://127.0.0.1:*,https://collab-research.vercel.app,https://*.vercel.app
```

Restrinja `https://*.vercel.app` para dominios especificos quando a producao estiver estabilizada.

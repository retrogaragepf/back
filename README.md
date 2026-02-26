# RetroGarage Backend

Backend de RetroGarage construido con NestJS, TypeORM y PostgreSQL.
Expone API REST documentada con Swagger, integra pagos con Stripe, carga de imagenes con Cloudinary, autenticacion JWT/Google y chat en tiempo real con Socket.IO.

## Stack

- Node.js + NestJS 11
- TypeScript
- PostgreSQL + TypeORM
- Swagger (`/api`)
- Stripe (checkout + webhook)
- Cloudinary
- Socket.IO (chat)
- Nodemailer (mail)

## Modulos principales

- `auth`: login/signup/JWT/google login
- `users`: perfil, administracion, bloqueo/desbloqueo
- `products`: CRUD de productos + aprobacion/rechazo admin
- `categories` y `eras`: catalogos (con seed automatico)
- `cart`: carrito del usuario
- `orders`: ordenes del comprador/admin
- `ventas`: ventas y metricas del vendedor
- `discounts`: cupones de descuento
- `stripe`: checkout, consulta de sesion y webhook
- `files`: upload/actualizacion de imagenes de producto
- `chat`: conversaciones REST + gateway websocket
- `notifications`: notificaciones y cron diario

## Requisitos

- Node.js 20+ (recomendado)
- npm
- PostgreSQL

## Instalacion y arranque local

```bash
npm install
```

1. Crear archivo de entorno:

```powershell
Copy-Item .env.example .env.development
```

2. Completar variables faltantes (ver tabla de abajo).
3. Levantar el servidor:

```bash
npm run start:dev
```

Servidor local por defecto: `http://localhost:3002`
Swagger: `http://localhost:3002/api`

## Variables de entorno

Estas variables se usan en el proyecto:

| Variable | Descripcion |
| --- | --- |
| `HOST` | Host de la app (default `localhost`) |
| `PORT` | Puerto de la app (default `3002`) |
| `DB_NAME` | Nombre de la base de datos PostgreSQL |
| `DB_HOST` | Host de PostgreSQL |
| `DB_PORT` | Puerto de PostgreSQL |
| `DB_USERNAME` | Usuario de PostgreSQL |
| `DB_PASSWORD` | Password de PostgreSQL |
| `JWT_SECRET` | Secreto para firmar JWT |
| `GOOGLE_CLIENT_ID` | Client ID para Google login |
| `GOOGLE_CLIENT_SECRET` | Client secret de Google (si aplica en tu flujo) |
| `GOOGLE_CALLBACK_URL` | URL callback Google (si aplica en tu flujo) |
| `CLOUDINARY_CLOUD_NAME` | Cloud name de Cloudinary |
| `CLOUDINARY_API_KEY` | API key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API secret de Cloudinary |
| `STRIPE_SECRET_KEY` | Secret key de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Signing secret del webhook Stripe |
| `EMAIL_HOST` | Host SMTP |
| `EMAIL_PORT` | Puerto SMTP |
| `EMAIL_USER` | Usuario SMTP / API key |
| `EMAIL_PASS` | Password SMTP / API secret |
| `EMAIL_FROM` | Remitente por defecto |

## Scripts utiles

| Script | Uso |
| --- | --- |
| `npm run start:dev` | Modo desarrollo |
| `npm run build` | Compilar a `dist` |
| `npm run start` | Ejecutar build (`node dist/main.js`) |
| `npm run lint` | Lint con autofix |
| `npm run test` | Tests unitarios |
| `npm run test:e2e` | Tests end-to-end |
| `npm run test:cov` | Cobertura |

## Migraciones (TypeORM)

Scripts disponibles:

```bash
npm run migration:create
npm run migration:generate
npm run migration:run:ts
npm run migration:revert:ts
```

Tambien existen scripts contra `dist`:

```bash
npm run build
npm run migration:run
npm run migration:revert
```

Nota: el datasource de migraciones usa `dotenv/config` por defecto. Si corres migraciones en local, asegurate de tener variables en entorno o en un archivo `.env`.

## Seed automatico

Al iniciar la app, `SeederService` crea categorias y eras si no existen registros.

## Stripe webhook (local)

El endpoint de webhook es:

`POST /api/stripe/webhook`

La app ya configura `express.raw()` para ese endpoint. En local puedes reenviar eventos con Stripe CLI:

```bash
stripe listen --forward-to localhost:3002/api/stripe/webhook
```

## Chat en tiempo real (Socket.IO)

- Handshake JWT en `handshake.auth.token`
- Eventos principales: `joinConversation`, `sendMessage`, `newMessage` (emitido por el servidor)

## Rutas base de la API

- `/auth`
- `/users`
- `/products`
- `/categories`
- `/eras`
- `/cart`
- `/orders`
- `/ventas`
- `/discounts`
- `/api/stripe`
- `/files`
- `/chat`
- `/notifications`

## Deploy

La documentacion Swagger tambien incluye servidor de referencia en:

`https://back-0o27.onrender.com`

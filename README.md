# Rosters eSports: API REST + Frontend Admin y Public

Aplicación web para gestionar jugadores y rosters de eSports (League of Legends). Proyecto de Desarrollo Web, UABC.

- **Backend:** API REST con Express, Sequelize y MySQL. Autenticación con JWT en cookie HttpOnly y protección CSRF (double submit cookie).
- **Frontend:** panel de administración y vista Public de solo lectura con registro abierto, en React + TypeScript + Vite.
- **Pruebas:** suite del API (`npm test`) y pruebas end-to-end con Playwright.

## Estructura

```
.
├── backend/    # API REST (Node.js, Express, Sequelize, MySQL)
├── frontend/   # Panel Admin (React, TypeScript, Vite)
└── README.md
```

La documentación detallada de la API (endpoints, reglas de negocio, modelo de datos) está en [`backend/README.md`](backend/README.md).

## Requisitos

- Node.js 20 o superior
- MySQL 8

## Instalación

**1. Clonar el repositorio**

```
git clone https://github.com/RAReyna/Meta-3.2_Desarrollar-REST-API.git
cd Meta-3.2_Desarrollar-REST-API
```

**2. Crear la base de datos y un usuario de MySQL**

Con el servicio activo (en Linux/WSL: `sudo service mysql start`), abre `sudo mysql` y ejecuta:

```
CREATE DATABASE roster_api CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'roster'@'localhost' IDENTIFIED BY 'tu_contrasena';
GRANT ALL PRIVILEGES ON roster_api.* TO 'roster'@'localhost';
FLUSH PRIVILEGES;
```

**3. Configurar y preparar el backend**

```
cd backend
npm install
cp .env.example .env
```

Edita `backend/.env` con tus valores:

| Variable         | Descripción                                          | Ejemplo               |
| ---------------- | ---------------------------------------------------- | --------------------- |
| `PORT`           | Puerto del servidor                                  | `3000`                |
| `DB_HOST`        | Servidor MySQL                                       | `127.0.0.1`           |
| `DB_PORT`        | Puerto de MySQL                                      | `3306`                |
| `DB_NAME`        | Nombre de la base de datos                           | `roster_api`          |
| `DB_USER`        | Usuario de MySQL                                     | `roster`              |
| `DB_PASSWORD`    | Contraseña del usuario de MySQL                      |                       |
| `JWT_SECRET`     | Secreto para firmar los JWT (cadena larga aleatoria) |                       |
| `COOKIE_MAX_AGE` | Duración de la sesión en milisegundos                | `3600000` (1 hora)    |
| `ADMIN_EMAIL`    | Email del usuario administrador inicial              | `admin@example.com`   |
| `ADMIN_PASSWORD` | Contraseña del administrador inicial                 |                       |

Para generar un `JWT_SECRET`:

```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Crea las tablas y el usuario administrador:

```
npm run db:migrate
npm run seed:admin
```

**4. Instalar el frontend**

```
cd ../frontend
npm install
npx playwright install chromium   # navegador para las pruebas e2e
```

## Ejecución

Se usan dos terminales.

```
# Terminal 1: backend en http://localhost:3000
cd backend
npm run dev

# Terminal 2: frontend en http://localhost:5173
cd frontend
npm run dev
```

Abre <http://localhost:5173> e inicia sesión con `ADMIN_EMAIL` y `ADMIN_PASSWORD`, o crea una cuenta public desde **Regístrate**.

El servidor de desarrollo de Vite redirige las peticiones de `/api` al backend (proxy). Así el navegador trabaja con un solo origen y las cookies con `SameSite=Strict` funcionan sin configurar CORS.

## Funcionalidades del frontend

Todas las páginas requieren iniciar sesión. Después del login, cada rol llega a su vista: el admin a `/admin/jugadores` y el public a `/jugadores`.

### Rol Admin

- Inicio y cierre de sesión; la sesión se restaura al recargar la página.
- **Jugadores:** listar, buscar por nickname, filtrar por rol y estado, crear, editar y eliminar.
- **Rosters:** listar, filtrar por tipo y temporada, crear, editar y eliminar.
- **Asignación:** asignar jugadores a un roster como titular o suplente, cambiar su rol y quitarlos.
- Los errores del API (nickname duplicado, sexto titular, rol repetido, etc.) se muestran en pantalla.
- Las rutas `/admin/*` solo son accesibles con una sesión de administrador.

### Rol Public (solo lectura)

- **Registro abierto** en `/registro`: cualquiera crea su cuenta con email y contraseña (8 a 72 caracteres). Toda cuenta nueva tiene rol `public`.
- **Jugadores** (`/jugadores`): listar, buscar por nickname y filtrar por rol y estado.
- **Rosters** (`/rosters`): listar y filtrar por tipo y temporada.
- **Detalle de roster** (`/rosters/:id`): jugadores del roster con su rol de titular o suplente.
- Sin formularios ni botones de edición. Si un usuario public abre una ruta `/admin/*`, se le redirige a `/jugadores`.

## Seguridad: JWT en cookie y protección CSRF

El esquema usa **double submit cookie**.

1. `POST /api/v1/auth/login` valida email y contraseña (hash con bcrypt) contra la tabla `usuarios`. `POST /api/v1/auth/registro` crea la cuenta y abre la sesión de la misma forma; el rol siempre es `public` (un `rol` enviado en el body se ignora).
2. Si son correctos, el servidor genera un token CSRF aleatorio y responde con dos cookies:
   - `jwt_token`: el JWT, con `HttpOnly` (JavaScript no puede leerla). Su payload incluye el id del usuario, su rol y el token CSRF.
   - `csrf_token`: el mismo token CSRF, **legible** por JavaScript.
   Ambas usan `SameSite=Strict`, y `Secure` en producción.
3. En cada petición que modifica datos (POST, PUT, DELETE), el frontend lee la cookie `csrf_token` y la reenvía en el header `x-csrf-token`.
4. El servidor acepta la petición solo si el header, la cookie y el valor dentro del JWT coinciden, y si el rol del usuario es `admin`. Las comparaciones usan `crypto.timingSafeEqual`.

Un sitio externo puede provocar que el navegador envíe las cookies, pero no puede leer `csrf_token` ni agregar el header, así que el ataque CSRF falla.

### Autorización por método

| Petición                         | Requisito                    | Respuesta si falta       |
| -------------------------------- | ---------------------------- | ------------------------ |
| `/auth/login`, `/auth/registro`  | Ninguno                      |                          |
| `/health` y catálogos            | Ninguno                      |                          |
| `GET` de jugadores y rosters     | Sesión válida (admin o public) | 401                    |
| `POST` / `PUT` / `DELETE`        | Sesión válida                | 401                      |
|                                  | Token CSRF válido            | 403                      |
|                                  | Rol `admin`                  | 403                      |

### Endpoints de autenticación

| Método | Endpoint                | Descripción                                          |
| ------ | ----------------------- | ---------------------------------------------------- |
| POST   | `/api/v1/auth/login`    | Inicia sesión y establece las cookies                |
| POST   | `/api/v1/auth/registro` | Crea una cuenta public y abre la sesión (409 si el email ya existe) |
| POST   | `/api/v1/auth/logout`   | Cierra la sesión (requiere token CSRF)               |
| GET    | `/api/v1/auth/me`       | Devuelve el usuario de la sesión y su token CSRF     |

### Limitaciones conocidas

- El JWT no se puede revocar antes de expirar: el logout borra las cookies del navegador, pero el servidor no invalida el token. Una mejora sería usar JWT de vida corta con refresh tokens guardados en base de datos.
- No hay límite de intentos de login ni de registro (rate limiting).
- No hay forma de borrar cuentas. Las pruebas (`npm test` y Playwright) crean cuentas public de prueba con emails `@example.com` que quedan en la base de datos.

## Pruebas

### API (backend)

Con el backend corriendo y el administrador creado:

```
cd backend
npm test
```

Ejecuta 76 pruebas: inicio de sesión, registro, los endpoints, las reglas de negocio y los casos de seguridad (sin sesión, sin token CSRF, token incorrecto, cuenta public que intenta escribir, logout).

### End-to-end (Playwright)

Prueban la aplicación en un navegador real (Chromium). Requisitos: MySQL activo, el administrador creado y `ADMIN_EMAIL` / `ADMIN_PASSWORD` en `backend/.env` (la configuración de Playwright lee ese archivo). No hace falta levantar los servidores: Playwright inicia el backend y Vite, o reutiliza los que ya estén corriendo.

```
cd frontend
npm run test:e2e                          # todas las pruebas
npx playwright test --ui                  # modo visual, paso a paso
npx playwright test e2e/public.spec.ts    # un solo archivo
npx playwright test -g "registro"         # pruebas cuyo nombre contiene "registro"
npx playwright show-report                # reporte HTML de la última corrida
```

| Archivo                  | Pruebas | Qué cubre                                                                                     |
| ------------------------ | ------- | --------------------------------------------------------------------------------------------- |
| `e2e/admin.spec.ts`      | 7       | Login y logout, CRUD de jugadores, filtros, CRUD de rosters, asignación, reglas de negocio, guarda de `/admin` |
| `e2e/public.spec.ts`     | 6       | Registro, login obligatorio, jugadores y filtros, rosters y detalle, sin controles de edición, sin acceso a `/admin` |
| `e2e/seguridad.spec.ts`  | 8       | Cookie HttpOnly y SameSite, CSRF ausente, incorrecto o de otra sesión, rol public, sin sesión, JWT alterado, logout |

- Las pruebas corren una por una porque comparten la base de datos.
- Los jugadores y rosters de prueba llevan un sufijo único por corrida y se borran al terminar, aunque una prueba falle.
- Si una prueba falla, Playwright guarda una traza (capturas, red y DOM de cada paso) que se abre desde el reporte HTML.

## Tecnologías

Node.js · Express · MySQL · Sequelize · Zod · jsonwebtoken · bcryptjs · cookie-parser · React · TypeScript · Vite · React Router · TanStack Query · Playwright

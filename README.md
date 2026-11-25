# Rosters eSports: API REST + Frontend en Vue

Aplicación para gestionar jugadores de eSports y armar rosters de equipos (League of Legends).
Proyecto de Desarrollo Web, UABC.

- **Backend:** Node.js con **ES modules** (`import` / `export`), Express 5 y **MySQL** con consultas SQL directas (`mysql2`).
- **Frontend:** Vue 3 + Vuetify + TypeScript (Vite, Vue Router, Pinia).
- Consulta pública: cualquiera puede ver jugadores y rosters sin cuenta.
- Solo el administrador modifica datos: JWT en cookie HttpOnly y protección CSRF (double submit cookie).
- Validación con Zod y documentación OpenAPI con Swagger UI.
- Pruebas: suite del API (`npm test`) y pruebas end-to-end con Playwright.

## Estructura

```
.
├── README.md
├── backend/
    ├── server.js            # arranque: verifica MySQL e inicia el servidor
    ├── openapi.yaml         # especificación OpenAPI (visible en /docs)
    ├── api.http             # peticiones para probar a mano (REST Client)
    ├── .env.example         # plantilla de variables de entorno
    ├── db/
    │   └── schema.sql       # tablas de la base de datos
    ├── scripts/
    │   ├── crear-tablas.js  # npm run db:init
    │   ├── crear-admin.js   # npm run seed:admin
    │   └── llenar-datos.js  # npm run seed:datos
    ├── test/
    │   └── endpoints.js     # npm test
    └── src/
        ├── app.js           # Express: middlewares, rutas y /docs
        ├── db.js            # pool de MySQL y helper de transacciones
        ├── errors.js        # HttpError y manejo de errores
        ├── constantes.js    # roles, estados y tipos válidos
        ├── middleware/      # autenticación, CSRF y rol admin
        ├── routes/          # URLs → controllers
        ├── controllers/     # entrada/salida HTTP y validación (Zod)
        └── services/        # reglas de negocio y consultas SQL
└── frontend/
    ├── vite.config.ts       # Vuetify, alias "@" y proxy /api → backend
    ├── playwright.config.ts # pruebas e2e (lee backend/.env)
    ├── e2e/                 # npm run test:e2e
    └── src/
        ├── main.ts          # crea la app con Pinia, router y Vuetify
        ├── App.vue          # barra superior, tema claro/oscuro y avisos
        ├── api.ts           # fetch al API con el header CSRF
        ├── errores.ts       # mensajes de error para el usuario
        ├── types.ts         # tipos y valores válidos
        ├── colores.ts       # colores de los chips por estado y tipo
        ├── plugins/         # configuración de Vuetify (tema, español)
        ├── router/          # rutas y guard de sesión
        ├── stores/          # Pinia: sesión del usuario
        ├── composables/     # carga de datos y avisos
        ├── components/      # diálogos de jugador, roster y confirmación
        └── views/           # portada, jugadores, rosters, detalle, login, registro
```

En el backend, cada petición sigue el mismo camino: `routes` → `controllers` (valida) → `services` (reglas y SQL) → MySQL.

En desarrollo, el navegador solo habla con Vite (puerto 5173), que reenvía `/api` al backend
(puerto 3000). Así las cookies `SameSite=Strict` funcionan sin configurar CORS.

## Requisitos

- Node.js 20.19 o superior (lo piden Vite y ESLint)
- MySQL 8

## Instalación

**1. Clonar e instalar dependencias**

```bash
git clone https://github.com/RAReyna/Meta-3.2_Desarrollar-REST-API.git
cd Meta-3.2_Desarrollar-REST-API/backend
npm install
```

**2. Crear la base de datos y un usuario de MySQL**

Con el servicio activo (en Linux/WSL: `sudo service mysql start`), abre `sudo mysql` y ejecuta:

```sql
CREATE DATABASE roster_api CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'roster'@'localhost' IDENTIFIED BY 'tu_contrasena';
GRANT ALL PRIVILEGES ON roster_api.* TO 'roster'@'localhost';
FLUSH PRIVILEGES;
```

**3. Configurar las variables de entorno**

```bash
cp .env.example .env
```

| Variable         | Descripción                                          | Ejemplo             |
| ---------------- | ---------------------------------------------------- | ------------------- |
| `PORT`           | Puerto del servidor                                  | `3000`              |
| `DB_HOST`        | Servidor MySQL                                       | `127.0.0.1`         |
| `DB_PORT`        | Puerto de MySQL                                      | `3306`              |
| `DB_NAME`        | Nombre de la base de datos                           | `roster_api`        |
| `DB_USER`        | Usuario de MySQL                                     | `roster`            |
| `DB_PASSWORD`    | Contraseña del usuario de MySQL                      |                     |
| `JWT_SECRET`     | Secreto para firmar los JWT (cadena larga aleatoria) |                     |
| `COOKIE_MAX_AGE` | Duración de la sesión en milisegundos                | `3600000` (1 hora)  |
| `ADMIN_EMAIL`    | Email del usuario administrador                      | `admin@example.com` |
| `ADMIN_PASSWORD` | Contraseña del administrador                         |                     |

Para generar un `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**4. Crear las tablas y el administrador**

```bash
npm run db:init      # ejecuta db/schema.sql (no toca las tablas que ya existen)
npm run seed:admin   # crea el admin, o actualiza su contraseña si ya existe
npm run seed:datos   # opcional: jugadores y rosters de ejemplo (T1, Gen.G, G2...)
```

**5. Instalar el frontend**

```bash
cd ../frontend
npm install
npx playwright install chromium   # navegador para las pruebas e2e
```

**6. Iniciar el backend y el frontend**

```bash
# Terminal 1: API en http://localhost:3000
cd backend
npm run dev    # se reinicia al guardar cambios (npm start: sin recarga)

# Terminal 2: frontend en http://localhost:5173
cd frontend
npm run dev
```

Abre <http://localhost:5173>. Sin cuenta puedes consultar jugadores y rosters; para administrar,
inicia sesión con `ADMIN_EMAIL` y `ADMIN_PASSWORD`.

| Recurso                                | URL                                |
| -------------------------------------- | ---------------------------------- |
| API                                    | http://localhost:3000/api/v1       |
| Documentación interactiva (Swagger UI) | http://localhost:3000/docs         |
| Especificación OpenAPI en JSON         | http://localhost:3000/openapi.json |

## Funcionalidades del frontend

| Página          | Todos (con o sin cuenta)                                 | Además, el admin                                  |
| --------------- | -------------------------------------------------------- | ------------------------------------------------- |
| `/`             | Portada con accesos a jugadores y rosters                |                                                   |
| `/jugadores`    | Tabla con búsqueda por nickname y filtros de rol y estado | Crear, editar y eliminar jugadores (diálogos)     |
| `/rosters`      | Tabla con filtros de tipo y temporada; clic → detalle     | Crear, editar y eliminar rosters                  |
| `/rosters/:id`  | Titulares (x/5) y suplentes, ordenados por rol            | Asignar jugadores, pasar a titular/suplente, quitar |
| `/login`, `/registro` | Iniciar sesión o crear una cuenta public (solo lectura) |                                                |

- No hay páginas separadas para el admin: son las mismas vistas, con los botones de edición visibles solo para él.
- Los filtros se aplican en el navegador, sin volver a pedir los datos.
- Tema claro y oscuro (se recuerda al recargar) y diseño adaptado a celular.
- Los errores de las reglas de negocio (nickname repetido, sexto titular...) se muestran con el mensaje del API.

### Solución de problemas

- **`ECONNREFUSED` o "No se pudo conectar a MySQL":** el servicio no está activo (`sudo service mysql start`).
- **`Access denied`:** el usuario o la contraseña del `.env` no coinciden con los del `CREATE USER`.
- **`Table ... doesn't exist`:** falta `npm run db:init`.
- **"Falta JWT_SECRET en el .env":** define `JWT_SECRET` en `backend/.env`.

## Scripts

**Backend** (`cd backend`)

| Comando              | Descripción                                    |
| -------------------- | ---------------------------------------------- |
| `npm run dev`        | Inicia el servidor y lo reinicia al guardar    |
| `npm start`          | Inicia el servidor                             |
| `npm test`           | Ejecuta las pruebas (con el servidor corriendo) |
| `npm run db:init`    | Crea las tablas de `db/schema.sql`             |
| `npm run seed:admin` | Crea o actualiza el usuario administrador      |
| `npm run seed:datos` | Agrega jugadores y rosters de ejemplo (no duplica si se corre otra vez) |

**Frontend** (`cd frontend`)

| Comando            | Descripción                                          |
| ------------------ | ---------------------------------------------------- |
| `npm run dev`      | Servidor de desarrollo en http://localhost:5173      |
| `npm run build`    | Revisa los tipos (`vue-tsc`) y genera `dist/`        |
| `npm run preview`  | Sirve el `dist/` generado                            |
| `npm run lint`     | ESLint (reglas de Vue y TypeScript)                  |
| `npm run test:e2e` | Pruebas end-to-end con Playwright                    |

## Endpoints

Todos cuelgan de `/api/v1` y trabajan con JSON.

### Autenticación

| Método | Endpoint         | Descripción                                                         |
| ------ | ---------------- | ------------------------------------------------------------------- |
| POST   | `/auth/login`    | Inicia sesión (`{ "email", "password" }`)                           |
| POST   | `/auth/registro` | Crea una cuenta public y abre la sesión (409 si el email ya existe) |
| POST   | `/auth/logout`   | Cierra la sesión (requiere token CSRF)                              |
| GET    | `/auth/me`       | Usuario de la sesión actual y su token CSRF                         |

### Jugadores

| Método | Endpoint                          | Descripción                                             |
| ------ | --------------------------------- | ------------------------------------------------------- |
| GET    | `/jugadores?rol=&estado=&search=` | Listar, filtrar por rol o estado, y buscar por nickname |
| GET    | `/jugadores/{id}`                 | Detalle de un jugador                                   |
| POST   | `/jugadores`                      | Crear jugador                                           |
| PUT    | `/jugadores/{id}`                 | Actualizar jugador (reemplaza todos los campos)         |
| DELETE | `/jugadores/{id}`                 | Eliminar jugador                                        |

### Rosters

| Método | Endpoint                    | Descripción                                   |
| ------ | --------------------------- | --------------------------------------------- |
| GET    | `/rosters?tipo=&temporada=` | Listar rosters (incluye `cantidad_jugadores`) |
| GET    | `/rosters/{id}`             | Detalle del roster con sus jugadores          |
| POST   | `/rosters`                  | Crear roster                                  |
| PUT    | `/rosters/{id}`             | Actualizar roster                             |
| DELETE | `/rosters/{id}`             | Eliminar roster (los jugadores permanecen)    |

### Asignación de jugadores a rosters

| Método | Endpoint                               | Descripción                              |
| ------ | -------------------------------------- | ---------------------------------------- |
| GET    | `/rosters/{id}/jugadores`              | Listar jugadores del roster              |
| POST   | `/rosters/{id}/jugadores`              | Asignar jugador (`Titular` o `Suplente`) |
| PUT    | `/rosters/{id}/jugadores/{id_jugador}` | Cambiar su rol en el roster              |
| DELETE | `/rosters/{id}/jugadores/{id_jugador}` | Quitar jugador del roster                |

### Auxiliares (sin sesión)

| Método | Endpoint        | Descripción                      |
| ------ | --------------- | -------------------------------- |
| GET    | `/health`       | Verificar que el API está activa |
| GET    | `/roles`        | Top, Jungle, Mid, ADC, Support   |
| GET    | `/estados`      | activo, inactivo                 |
| GET    | `/tipos-roster` | Principal, Academy               |

### Valores válidos

- **rol**: `Top`, `Jungle`, `Mid`, `ADC`, `Support`
- **estado**: `activo` (por defecto), `inactivo`
- **tipo** de roster: `Principal`, `Academy`
- **rol_en_roster**: `Titular`, `Suplente`
- **juego**: `League of Legends` por defecto

### Probar los endpoints a mano

- **`backend/api.http`**: todas las peticiones, en orden, para la extensión
  [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) de VS Code.
  Haz clic en _Send Request_ sobre cada una de arriba hacia abajo: el login guarda la sesión y las
  siguientes reutilizan el token CSRF y los ids creados. El email y la contraseña del admin se leen del `.env`.
- **Swagger UI**: http://localhost:3000/docs, con el botón _Try it out_.

## Reglas de negocio

- El nickname de un jugador es único (sin distinguir mayúsculas de minúsculas).
- Un roster puede tener como máximo 5 titulares.
- No puede haber dos titulares con el mismo rol de jugador en un roster.
- Un jugador puede estar en varios rosters, pero no repetido dentro del mismo.
- Al eliminar un roster, los jugadores permanecen en el sistema.

Asignar un jugador y cambiar su rol se hacen en una transacción que bloquea el roster
(`SELECT ... FOR UPDATE`): dos peticiones simultáneas no pueden dejar un roster con 6 titulares.

## Seguridad: JWT en cookie y protección CSRF

Leer jugadores y rosters es **público**: no hace falta cuenta. Crear, modificar y eliminar
requiere una sesión de administrador. Las cuentas `public` (registro abierto) solo pueden leer,
igual que un visitante sin cuenta.

Las escrituras usan el esquema **double submit cookie**.

1. `POST /auth/login` valida email y contraseña (hash con bcrypt) contra la tabla `usuarios`. `POST /auth/registro` crea la cuenta y abre la sesión de la misma forma; el rol siempre es `public` (un `rol` enviado en el body se ignora).
2. Si son correctos, el servidor genera un token CSRF aleatorio y responde con dos cookies:
   - `jwt_token`: el JWT, con `HttpOnly` (JavaScript no puede leerla). Su payload incluye el id del usuario, su rol y el token CSRF.
   - `csrf_token`: el mismo token CSRF, **legible** por JavaScript.
   Ambas usan `SameSite=Strict`, y `Secure` en producción.
3. En cada petición que modifica datos (POST, PUT, DELETE), el cliente reenvía el token CSRF en el header `x-csrf-token` (el frontend lo lee de la cookie `csrf_token`).
4. El servidor acepta la petición solo si el header, la cookie y el valor dentro del JWT coinciden, y si el rol del usuario es `admin`. Las comparaciones usan `crypto.timingSafeEqual`.

Un sitio externo puede provocar que el navegador envíe las cookies, pero no puede leer `csrf_token` ni agregar el header, así que el ataque CSRF falla.

| Petición                        | Requisito                      | Respuesta si falta |
| ------------------------------- | ------------------------------ | ------------------ |
| `/auth/login`, `/auth/registro` | Ninguno                        |                    |
| `/health` y catálogos           | Ninguno                        |                    |
| `GET` de jugadores y rosters    | Ninguno (público)              |                    |
| `POST` / `PUT` / `DELETE`       | Sesión válida                  | 401                |
|                                 | Token CSRF válido              | 403                |
|                                 | Rol `admin`                    | 403                |

### Ejemplo con curl

```bash
# 1. Iniciar sesión: guarda las cookies en cookies.txt y muestra el csrfToken
curl -c cookies.txt -X POST localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"tu_contrasena"}'

# 2. Crear un jugador con la cookie y el token CSRF
curl -b cookies.txt -X POST localhost:3000/api/v1/jugadores \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: <csrfToken del paso 1>" \
  -d '{"nickname":"Faker","nombre_real":"Lee Sang-hyeok","pais":"Corea del Sur","rol":"Mid"}'

# 3. Leer no necesita sesión
curl localhost:3000/api/v1/jugadores
```

### Limitaciones conocidas

- El JWT no se puede revocar antes de expirar: el logout borra las cookies del navegador, pero el servidor no invalida el token.
- No hay límite de intentos de login ni de registro (rate limiting).
- No hay forma de borrar cuentas. Las pruebas (`npm test` y Playwright) crean cuentas public con emails `@example.com` que quedan en la base de datos.

## Códigos de respuesta

| Código | Uso                                                                                         |
| ------ | ------------------------------------------------------------------------------------------- |
| 200    | OK (GET, PUT)                                                                               |
| 201    | Creado (POST)                                                                               |
| 204    | Sin contenido (DELETE, logout)                                                              |
| 400    | Datos inválidos                                                                             |
| 401    | Sin sesión o credenciales inválidas                                                         |
| 403    | Token CSRF inválido o rol sin permiso                                                       |
| 404    | Recurso no encontrado                                                                       |
| 409    | Conflicto (nickname duplicado, sexto titular, rol de titular repetido, jugador ya asignado) |
| 500    | Error interno                                                                               |

Los errores responden con `{ "error": "mensaje" }`. En los errores de validación (400) se incluye además `detalles`.

## Modelo de datos

Definido en [`backend/db/schema.sql`](backend/db/schema.sql).

```
jugadores                         rosters
├── id (PK)                       ├── id (PK)
├── nickname (único)              ├── nombre
├── nombre_real                   ├── juego
├── pais                          ├── tipo (Principal / Academy)
├── rol (Top … Support)           └── temporada
└── estado (activo / inactivo)

roster_jugador                    usuarios
├── id (PK)                       ├── id (PK)
├── id_roster  (FK → rosters)     ├── email (único)
├── id_jugador (FK → jugadores)   ├── password_hash
├── rol_en_roster                 └── rol (admin / public)
└── único (id_roster, id_jugador)
```

Las FK de `roster_jugador` usan `ON DELETE CASCADE`: borrar un roster o un jugador borra sus asignaciones.

## Pruebas

### API

Con el servidor corriendo y el administrador creado, en otra terminal:

```bash
cd backend
npm test
```

Ejecuta 85 pruebas: inicio de sesión, registro, todos los endpoints, las reglas de negocio, dos asignaciones
simultáneas al mismo roster, y los casos de seguridad (sin sesión, sin token CSRF, token incorrecto, cuenta
public que intenta escribir, logout). Borra los jugadores y rosters que crea.

### End-to-end (Playwright)

Prueban la aplicación en un navegador real (Chromium). Requisitos: MySQL activo, el administrador creado y
`ADMIN_EMAIL` / `ADMIN_PASSWORD` en `backend/.env` (la configuración de Playwright lee ese archivo).
No hace falta levantar los servidores: Playwright inicia el backend y Vite, o reutiliza los que ya estén corriendo.

```bash
cd frontend
npm run test:e2e                          # todas las pruebas
npx playwright test --ui                  # modo visual, paso a paso
npx playwright test e2e/public.spec.ts    # un solo archivo
npx playwright test -g "registro"         # pruebas cuyo nombre contiene "registro"
npx playwright show-report                # reporte HTML de la última corrida
```

| Archivo                 | Pruebas | Qué cubre                                                                                     |
| ----------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `e2e/public.spec.ts`    | 6       | Registro, consulta sin cuenta, filtros, detalle de roster, cuenta public sin controles de edición, rutas |
| `e2e/admin.spec.ts`     | 6       | Login y logout, CRUD de jugadores y rosters, filtros, asignación y cambio de rol, reglas de negocio |
| `e2e/seguridad.spec.ts` | 8       | Cookie HttpOnly y SameSite, CSRF ausente, incorrecto o de otra sesión, rol public, sin sesión, JWT alterado, logout |

- Las pruebas corren una por una (comparten la base de datos) y borran los jugadores y rosters que crean.
- Si una prueba falla, Playwright guarda una traza (capturas, red y DOM de cada paso) que se abre desde el reporte HTML.

## Tecnologías

**Backend:** Node.js (ES modules) · Express 5 · MySQL 8 · mysql2 · Zod · jsonwebtoken · bcryptjs · cookie-parser · OpenAPI 3 con Swagger UI

**Frontend:** Vue 3 · Vuetify · TypeScript · Vite · Vue Router · Pinia · ESLint · Playwright

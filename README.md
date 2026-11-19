# Rosters eSports: API REST + Frontend Admin

Aplicación web para gestionar jugadores y rosters de eSports (League of Legends). Proyecto de Desarrollo Web, UABC.

- **Backend:** API REST con Express, Sequelize y MySQL. Autenticación con JWT en cookie HttpOnly y protección CSRF (double submit cookie).
- **Frontend:** panel de administración en React + TypeScript + Vite.

> **Nota sobre la rama `google-auth`:** esta rama se creó únicamente para implementar el Trabajo 2 (autenticación con Google OAuth) sobre el código del Trabajo 1. No contiene otros cambios y no se usa para desarrollo adicional.

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
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth | |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google OAuth | |
| `GOOGLE_REDIRECT_URI` | URI de callback registrada en Google | `http://localhost:3000/api/v1/auth/google/callback` |
| `FRONTEND_URL` | URL del frontend (destino tras el login con Google) | `http://localhost:5173` |

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

Abre <http://localhost:5173> e inicia sesión con `ADMIN_EMAIL` y `ADMIN_PASSWORD`.

El servidor de desarrollo de Vite redirige las peticiones de `/api` al backend (proxy). Así el navegador trabaja con un solo origen y las cookies con `SameSite=Strict` funcionan sin configurar CORS.

## Funcionalidades del frontend (rol Admin)

- Inicio y cierre de sesión; la sesión se restaura al recargar la página.
- **Jugadores:** listar, buscar por nickname, filtrar por rol y estado, crear, editar y eliminar.
- **Rosters:** listar, filtrar por tipo y temporada, crear, editar y eliminar.
- **Asignación:** asignar jugadores a un roster como titular o suplente, cambiar su rol y quitarlos.
- Los errores del API (nickname duplicado, sexto titular, rol repetido, etc.) se muestran en pantalla.
- Las rutas `/admin/*` solo son accesibles con una sesión de administrador.

## Seguridad: JWT en cookie y protección CSRF

El esquema usa **double submit cookie**.

1. `POST /api/v1/auth/login` valida email y contraseña (hash con bcrypt) contra la tabla `usuarios`.
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
| `GET` (lectura)                  | Ninguno (público)            |                          |
| `POST` / `PUT` / `DELETE`        | Sesión válida                | 401                      |
|                                  | Token CSRF válido            | 403                      |
|                                  | Rol `admin`                  | 403                      |

### Endpoints de autenticación

| Método | Endpoint                | Descripción                                          |
| ------ | ----------------------- | ---------------------------------------------------- |
| POST   | `/api/v1/auth/login`    | Inicia sesión y establece las cookies                |
| POST   | `/api/v1/auth/logout`   | Cierra la sesión (requiere token CSRF)               |
| GET    | `/api/v1/auth/me`       | Devuelve el usuario de la sesión y su token CSRF     |
| GET    | `/api/v1/auth/google/login`    | Redirige a Google para iniciar sesión |
| GET    | `/api/v1/auth/google/callback` | Recibe el código de Google, crea o vincula el usuario y establece las cookies |

### Limitaciones conocidas

- El JWT no se puede revocar antes de expirar: el logout borra las cookies del navegador, pero el servidor no invalida el token. Una mejora sería usar JWT de vida corta con refresh tokens guardados en base de datos.
- No hay límite de intentos de login (rate limiting).

## Autenticación con Google OAuth

Además del login local, se puede entrar con una cuenta de Google. Esta funcionalidad vive en la rama `google-auth` (ver nota al inicio).

### Flujo

1. `GET /api/v1/auth/google/login` genera un `state` aleatorio, lo guarda en la cookie HttpOnly `oauth_state` (`SameSite=Lax`, porque Google redirige de vuelta desde otro sitio) y redirige a Google.
2. Google redirige a `GET /api/v1/auth/google/callback` con `code` y `state`.
3. El backend valida el `state`, intercambia el `code` por un token y lee el perfil (`sub`, `email`, `email_verified`).
4. Busca al usuario por `google_id`. Si no existe, lo busca por email y lo vincula. Si tampoco existe, lo crea con rol `public`.
5. Emite las mismas cookies que el login local (`jwt_token` HttpOnly y `csrf_token`) y redirige al frontend. Si algo falla, redirige a `/login?error=<codigo>` y el frontend muestra el mensaje.

La tabla `usuarios` agrega la columna `google_id` (única) y `password_hash` pasa a ser opcional. La migración `20261119000001-agregar-google-id-usuarios.js` lo aplica con `npm run db:migrate`. Un usuario creado con Google no tiene contraseña, así que no puede entrar por el login local.

### Configuración en Google Cloud Console

1. Crear un proyecto en <https://console.cloud.google.com>.
2. En **APIs y servicios > Pantalla de consentimiento de OAuth**: tipo **Externo** y agregar los correos de prueba en **Usuarios de prueba**.
3. En **Credenciales > Crear credenciales > ID de cliente de OAuth**:
   - Tipo: **Aplicación web**
   - Orígenes autorizados de JavaScript: `http://localhost:5173`
   - URI de redireccionamiento autorizado: `http://localhost:3000/api/v1/auth/google/callback`
4. Copiar el Client ID y el Client Secret a `backend/.env`.

### Roles

Los usuarios nuevos que entran con Google reciben el rol `public`. Para convertir a alguien en admin se cambia su `rol` directamente en la tabla `usuarios`; como el rol va dentro del JWT, debe cerrar sesión y volver a entrar.

### Cómo probar

1. Iniciar backend y frontend como se indica en **Ejecución**.
2. Abrir <http://localhost:5173/login> y pulsar **Entrar con Google**.
3. Elegir una cuenta registrada como usuario de prueba.
4. Verificar en DevTools > Application > Cookies que existen `jwt_token` y `csrf_token`.

## Pruebas

Con el backend corriendo y el administrador creado:

```
cd backend
npm test
```

Ejecuta 64 pruebas: inicio de sesión, los endpoints, las reglas de negocio y los casos de seguridad (sin sesión, sin token CSRF, token incorrecto, logout).

## Tecnologías

Node.js · Express · MySQL · Sequelize · Zod · jsonwebtoken · bcryptjs · cookie-parser · React · TypeScript · Vite · React Router · TanStack Query

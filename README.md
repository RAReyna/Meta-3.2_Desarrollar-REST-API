# Meta 3.2: REST API de Jugadores y Rosters

API REST para gestionar perfiles de jugadores de eSports y armar rosters de equipos (League of Legends).
Proyecto de Desarrollo Web, UABC.

## Entregables

| Entregable                    | Dónde está                                                                         |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| Repositorio Git con el código | Este repositorio                                                                   |
| Base de datos funcional       | MySQL, con el esquema versionado mediante migraciones de Sequelize (`migrations/`) |
| Documentación OpenAPI         | `openapi.yaml` (raíz), visible en `/docs` y `/openapi.json`                        |
| README con instalación y uso  | Este archivo                                                                       |

## Tecnologías

Node.js · Express · MySQL · Sequelize (ORM y migraciones) · Zod · OpenAPI 3.0 con Swagger UI

## Instalación

Requisitos: Node.js 20 o superior y MySQL 8.

**1. Clonar e instalar dependencias**

```bash
git clone https://github.com/RAReyna/Meta-3.2_Desarrollar-REST-API.git
cd Meta-3.2_Desarrollar-REST-API
npm install
```

**2. Crear la base de datos y un usuario**

Con el servicio de MySQL activo (en Linux/WSL: `sudo service mysql start`), abre el cliente con `sudo mysql` y ejecuta:

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

Edita `.env` y coloca tu contraseña en `DB_PASSWORD`. Si usaste otros nombres de base de datos o usuario, ajústalos también.

| Variable      | Descripción                | Valor de ejemplo |
| ------------- | -------------------------- | ---------------- |
| `PORT`        | Puerto del servidor        | `3000`           |
| `DB_HOST`     | Servidor MySQL             | `127.0.0.1`      |
| `DB_PORT`     | Puerto de MySQL            | `3306`           |
| `DB_NAME`     | Nombre de la base de datos | `roster_api`     |
| `DB_USER`     | Usuario de MySQL           | `roster`         |
| `DB_PASSWORD` | Contraseña del usuario     |                  |

**4. Crear las tablas con las migraciones**

```bash
npm run db:migrate
```

Crea las tablas `jugadores`, `rosters` y `roster_jugador`. Para revertirlas todas: `npm run db:undo`.

**5. Iniciar el servidor**

```bash
npm run dev      # desarrollo (nodemon)
# npm start      # producción
```

El servidor queda en `http://localhost:3000`.

| Recurso                                | URL                                |
| -------------------------------------- | ---------------------------------- |
| API                                    | http://localhost:3000/api/v1       |
| Documentación interactiva (Swagger UI) | http://localhost:3000/docs         |
| Especificación OpenAPI en JSON         | http://localhost:3000/openapi.json |

### Solución de problemas

- **`ECONNREFUSED` o "No se pudo conectar a MySQL":** el servicio no está activo. En Linux/WSL: `sudo service mysql start`.
- **`Access denied`:** el usuario o la contraseña de `.env` no coinciden con los del `CREATE USER`.
- **`Table ... doesn't exist`:** falta ejecutar `npm run db:migrate`.
- **`npm install` falla al compilar algún paquete:** instala las herramientas de compilación (Linux/WSL: `sudo apt install build-essential python3`) y vuelve a intentarlo.

## Uso

Todos los endpoints cuelgan de `/api/v1` y trabajan con JSON.

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

### Auxiliares

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

### Ejemplo de flujo

```bash
# 1. Crear un jugador
curl -X POST localhost:3000/api/v1/jugadores \
  -H "Content-Type: application/json" \
  -d '{"nickname":"Faker","nombre_real":"Lee Sang-hyeok","pais":"Corea del Sur","rol":"Mid","estado":"activo"}'

# 2. Crear un roster
curl -X POST localhost:3000/api/v1/rosters \
  -H "Content-Type: application/json" \
  -d '{"nombre":"TL Principal","tipo":"Principal","temporada":"2026"}'

# 3. Asignar el jugador (id 1) al roster (id 1) como titular
curl -X POST localhost:3000/api/v1/rosters/1/jugadores \
  -H "Content-Type: application/json" \
  -d '{"id_jugador":1,"rol_en_roster":"Titular"}'

# 4. Ver el roster con sus jugadores
curl localhost:3000/api/v1/rosters/1
```

También se pueden probar todos los endpoints desde http://localhost:3000/docs con el botón _Try it out_.

## Reglas de negocio

- El nickname de un jugador es único (sin distinguir mayúsculas de minúsculas).
- Un roster puede tener como máximo 5 titulares.
- No puede haber dos titulares con el mismo rol de jugador en un roster.
- Un jugador puede estar en varios rosters, pero no repetido dentro del mismo.
- Al eliminar un roster, los jugadores permanecen en el sistema.

## Códigos de respuesta

| Código | Uso                                                                                         |
| ------ | ------------------------------------------------------------------------------------------- |
| 200    | OK (GET, PUT)                                                                               |
| 201    | Creado (POST)                                                                               |
| 204    | Sin contenido (DELETE)                                                                      |
| 400    | Datos inválidos                                                                             |
| 404    | Recurso no encontrado                                                                       |
| 409    | Conflicto (nickname duplicado, sexto titular, rol de titular repetido, jugador ya asignado) |
| 500    | Error interno                                                                               |

Los errores responden con `{ "error": "mensaje" }`. En los errores de validación (400) se incluye además `detalles`.

## Pruebas

Con el servidor corriendo y las migraciones aplicadas, en otra terminal:

```bash
npm test
```

Ejecuta 51 pruebas sobre todos los endpoints, los códigos de estado y las reglas de negocio. Crea sus propios datos de prueba y los elimina al terminar.

## Scripts disponibles

| Comando              | Descripción                               |
| -------------------- | ----------------------------------------- |
| `npm run dev`        | Inicia el servidor con recarga automática |
| `npm start`          | Inicia el servidor                        |
| `npm test`           | Ejecuta las pruebas de endpoints          |
| `npm run db:migrate` | Aplica las migraciones pendientes         |
| `npm run db:undo`    | Revierte todas las migraciones            |

## Estructura del proyecto

```
.
├── server.js            # arranque: conecta a MySQL e inicia el servidor
├── openapi.yaml         # especificación OpenAPI
├── endpoint-test.js     # pruebas de endpoints
├── .env.example         # plantilla de variables de entorno
├── .sequelizerc         # configuración del CLI de Sequelize
├── migrations/          # migraciones: creación de tablas
└── src/
    ├── app.js           # configuración de Express, rutas y /docs
    ├── db.js            # conexión Sequelize
    ├── errors.js        # manejo de errores
    ├── constantes.js    # roles, estados y tipos válidos
    ├── config/
    │   └── database.js  # configuración de conexión a MySQL
    ├── routes/          # URLs hacia controllers
    ├── controllers/     # entrada/salida HTTP y validación (Zod)
    ├── services/        # reglas de negocio
    └── models/          # modelos Sequelize y asociaciones
```

## Modelo de datos

```
jugadores
├── id (PK)
├── nickname (único)
├── nombre_real
├── pais
├── rol (Top / Jungle / Mid / ADC / Support)
└── estado (activo / inactivo)

rosters
├── id (PK)
├── nombre
├── juego
├── tipo (Principal / Academy)
└── temporada

roster_jugador
├── id (PK)
├── id_roster (FK → rosters, ON DELETE CASCADE)
├── id_jugador (FK → jugadores, ON DELETE CASCADE)
├── rol_en_roster (Titular / Suplente)
└── único (id_roster, id_jugador)
```

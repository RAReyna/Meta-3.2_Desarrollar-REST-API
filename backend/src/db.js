// La conexión la crea models/index.js (como en sequelize-cli); aquí solo se
// reexporta para quien la necesite sin los modelos (server.js).
// Una sola instancia (y un solo pool de conexiones) para toda la aplicación.
import { sequelize } from "../models/index.js";

export default sequelize;

const app = require('./src/app');
require('./src/db'); // crea las tablas al arrancar

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API en http://localhost:${PORT}/api/v1`));
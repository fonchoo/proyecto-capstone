// ============================================================
// src/index.js
// ============================================================
// Punto de entrada del backend: importa la app Express y la pone
// a escuchar en el puerto configurado (process.env.PORT o 3000).

import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
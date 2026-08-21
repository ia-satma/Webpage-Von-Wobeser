// La suite no debe heredar credenciales de despliegue ni fallar antes de
// ejecutar una prueba por falta de configuración. Los tests que usan datos
// sustituyen sus dependencias; esta URL local solo satisface la inicialización
// segura del adaptador de Postgres.
if (!process.env.DATABASE_APP_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://test:test@127.0.0.1:5432/test";
}

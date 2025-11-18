const { Pool } = require('pg');
const config = require('./config');

let pool = null;

/**
 * Inicializa el pool de conexiones a PostgreSQL
 */
function initDatabase() {
  if (!config.DATABASE.URL) {
    console.warn('⚠️  DATABASE_URL no configurada, las operaciones de base de datos estarán deshabilitadas');
    return null;
  }

  try {
    // Configurar el pool de conexiones
    pool = new Pool({
      connectionString: config.DATABASE.URL,
      ssl: config.DATABASE.URL.includes('render.com') 
        ? { rejectUnauthorized: false } 
        : false,
      max: 10, // Máximo de conexiones en el pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Evento cuando se conecta
    pool.on('connect', () => {
      console.log('✅ Conexión a la base de datos establecida');
    });

    // Evento de error
    pool.on('error', (err) => {
      console.error('❌ Error inesperado en el pool de base de datos:', err);
    });

    // Probar la conexión
    pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.error('❌ Error al probar la conexión a la base de datos:', err);
      } else {
        console.log('✅ Base de datos conectada correctamente:', res.rows[0].now);
      }
    });

    return pool;
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    return null;
  }
}

/**
 * Obtiene el pool de conexiones
 */
function getPool() {
  if (!pool) {
    throw new Error('Base de datos no inicializada. Llama a initDatabase() primero.');
  }
  return pool;
}

/**
 * Ejecuta una query
 */
async function query(text, params) {
  if (!pool) {
    throw new Error('Base de datos no disponible');
  }
  
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query ejecutada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error ejecutando query:', error);
    throw error;
  }
}

/**
 * Cierra el pool de conexiones
 */
async function closeDatabase() {
  if (pool) {
    try {
      await pool.end();
      console.log('✅ Pool de base de datos cerrado');
      pool = null;
    } catch (error) {
      console.error('❌ Error al cerrar el pool de base de datos:', error);
    }
  }
}

/**
 * Verifica si la base de datos está disponible
 */
function isDatabaseAvailable() {
  return pool !== null;
}

/**
 * Crea las tablas necesarias si no existen
 */
async function createTables() {
  if (!pool) {
    console.warn('⚠️  Base de datos no disponible, saltando creación de tablas');
    return;
  }

  const createEmailLogsTable = `
    CREATE TABLE IF NOT EXISTS email_logs (
      id SERIAL PRIMARY KEY,
      to_email VARCHAR(255) NOT NULL,
      subject VARCHAR(500) NOT NULL,
      status VARCHAR(50) NOT NULL,
      provider VARCHAR(50),
      error_message TEXT,
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await query(createEmailLogsTable);
    console.log('✅ Tabla email_logs verificada/creada');
  } catch (error) {
    console.error('❌ Error al crear tablas:', error);
  }
}

module.exports = {
  initDatabase,
  getPool,
  query,
  closeDatabase,
  isDatabaseAvailable,
  createTables
};

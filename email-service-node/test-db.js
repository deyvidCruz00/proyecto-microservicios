/**
 * Script para probar la conexión a la base de datos PostgreSQL de Render
 */
require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://administrator:H6Zwj6TSlL8htqwUD4hlvelwF53eSWFB@dpg-d4atribipnbc73ai9360-a.oregon-postgres.render.com/partyst';

async function testConnection() {
  console.log('🔄 Probando conexión a la base de datos...');
  console.log(`📍 Database URL: ${DATABASE_URL.replace(/:[^:]*@/, ':****@')}\n`);

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('render.com') 
      ? { rejectUnauthorized: false } 
      : false
  });

  try {
    // Probar conexión
    const client = await pool.connect();
    console.log('✅ Conexión exitosa!\n');

    // Obtener versión de PostgreSQL
    const versionResult = await client.query('SELECT version();');
    console.log('📌 PostgreSQL version:');
    console.log(`   ${versionResult.rows[0].version}\n`);

    // Listar tablas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📋 Tablas disponibles:');
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('   (No hay tablas creadas aún)');
    }
    console.log('');

    // Verificar tabla email_logs
    const emailLogsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'email_logs'
      );
    `);

    if (emailLogsExists.rows[0].exists) {
      console.log("✅ Tabla 'email_logs' encontrada");
      
      const countResult = await client.query('SELECT COUNT(*) FROM email_logs;');
      console.log(`📊 Registros en 'email_logs': ${countResult.rows[0].count}`);
    } else {
      console.log("⚠️  Tabla 'email_logs' no existe");
      console.log("   Se creará automáticamente al iniciar el servicio");
    }

    client.release();
    await pool.end();
    
    console.log('\n✨ Prueba completada exitosamente!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('\n💡 Posibles soluciones:');
    console.log('   - Verifica que DATABASE_URL esté configurada correctamente');
    console.log('   - Verifica tu conexión a internet');
    console.log('   - Verifica que la base de datos en Render esté activa');
    
    await pool.end();
    process.exit(1);
  }
}

testConnection();

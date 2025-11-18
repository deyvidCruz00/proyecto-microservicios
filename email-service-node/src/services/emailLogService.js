const database = require('../database');

/**
 * Registra un log de email enviado
 */
async function logEmail({ to, subject, status, provider, errorMessage = null }) {
  if (!database.isDatabaseAvailable()) {
    console.warn('⚠️  Base de datos no disponible, no se puede registrar el log');
    return null;
  }

  try {
    const query = `
      INSERT INTO email_logs (to_email, subject, status, provider, error_message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    
    const values = [to, subject, status, provider, errorMessage];
    const result = await database.query(query, values);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error registrando log de email:', error);
    return null;
  }
}

/**
 * Obtiene los logs de emails con paginación
 */
async function getEmailLogs({ limit = 50, offset = 0, status = null }) {
  if (!database.isDatabaseAvailable()) {
    return { logs: [], total: 0 };
  }

  try {
    let query = 'SELECT * FROM email_logs';
    let countQuery = 'SELECT COUNT(*) FROM email_logs';
    const params = [];
    
    if (status) {
      query += ' WHERE status = $1';
      countQuery += ' WHERE status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const [logsResult, countResult] = await Promise.all([
      database.query(query, params),
      database.query(countQuery, status ? [status] : [])
    ]);
    
    return {
      logs: logsResult.rows,
      total: parseInt(countResult.rows[0].count)
    };
  } catch (error) {
    console.error('Error obteniendo logs de emails:', error);
    return { logs: [], total: 0 };
  }
}

/**
 * Obtiene estadísticas de emails
 */
async function getEmailStats() {
  if (!database.isDatabaseAvailable()) {
    return null;
  }

  try {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        COUNT(DISTINCT to_email) as unique_recipients
      FROM email_logs;
    `;
    
    const result = await database.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error obteniendo estadísticas de emails:', error);
    return null;
  }
}

module.exports = {
  logEmail,
  getEmailLogs,
  getEmailStats
};

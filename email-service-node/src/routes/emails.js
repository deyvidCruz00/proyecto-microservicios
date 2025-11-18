const express = require('express');
const Joi = require('joi');
const emailService = require('../services/emailService');
const router = express.Router();

// Schema de validación para envío de email
const emailSchema = Joi.object({
  to_email: Joi.string().email().required(),
  to_name: Joi.string().optional(),
  subject: Joi.string().required(),
  body: Joi.string().required(),
  template_data: Joi.object().optional(),
  event_type: Joi.string().optional(),
  related_user_id: Joi.string().optional(),
  related_project_id: Joi.string().optional()
});

// POST /api/v1/emails/send - Enviar email
router.post('/send', async (req, res) => {
  try {
    // Validar datos de entrada
    const { error, value } = emailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.details.map(detail => detail.message)
      });
    }

    // Enviar email
    const result = await emailService.sendEmail(value);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error en /send:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// GET /api/v1/emails/health - Health check
router.get('/health', (req, res) => {
  res.json(emailService.getHealth());
});

// GET /api/v1/emails/logs - Ver logs de emails (desde memoria)
router.get('/logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = emailService.getEmailLogs(limit);
    res.json({
      logs,
      total: logs.length,
      source: 'memory'
    });
  } catch (error) {
    console.error('Error en /logs:', error);
    res.status(500).json({
      error: 'Error obteniendo logs',
      message: error.message
    });
  }
});

// GET /api/v1/emails/logs/db - Ver logs de emails desde base de datos
router.get('/logs/db', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const status = req.query.status || null;
    
    const result = await emailService.getEmailLogsFromDB({ limit, offset, status });
    res.json(result);
  } catch (error) {
    console.error('Error en /logs/db:', error);
    res.status(500).json({
      error: 'Error obteniendo logs de base de datos',
      message: error.message
    });
  }
});

// GET /api/v1/emails/stats - Estadísticas (desde memoria)
router.get('/stats', (req, res) => {
  try {
    const stats = emailService.getStats();
    res.json({
      ...stats,
      source: 'memory'
    });
  } catch (error) {
    console.error('Error en /stats:', error);
    res.status(500).json({
      error: 'Error obteniendo estadísticas',
      message: error.message
    });
  }
});

// GET /api/v1/emails/stats/db - Estadísticas desde base de datos
router.get('/stats/db', async (req, res) => {
  try {
    const stats = await emailService.getStatsFromDB();
    res.json(stats || { error: 'Base de datos no disponible' });
  } catch (error) {
    console.error('Error en /stats/db:', error);
    res.status(500).json({
      error: 'Error obteniendo estadísticas de base de datos',
      message: error.message
    });
  }
});

module.exports = router;
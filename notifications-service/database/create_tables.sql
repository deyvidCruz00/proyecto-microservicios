-- Script SQL para crear manualmente la tabla de notificaciones
-- Este script es útil si necesitas crear la tabla manualmente
-- Normalmente, el servicio la crea automáticamente al iniciar

-- Crear la tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    notificationid VARCHAR(36) PRIMARY KEY,
    userid VARCHAR(36) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('warning', 'success', 'informative', 'application')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    was_read BOOLEAN DEFAULT FALSE NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    related_project_id VARCHAR(36),
    related_user_id VARCHAR(36),
    related_task_id VARCHAR(36)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_notifications_userid ON notifications(userid);
CREATE INDEX IF NOT EXISTS idx_notifications_was_read ON notifications(was_read);
CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_related_project ON notifications(related_project_id);

-- Comentarios para documentación
COMMENT ON TABLE notifications IS 'Tabla de notificaciones del sistema';
COMMENT ON COLUMN notifications.notificationid IS 'ID único de la notificación (UUID)';
COMMENT ON COLUMN notifications.userid IS 'ID del usuario que recibe la notificación';
COMMENT ON COLUMN notifications.type IS 'Tipo de notificación: warning, success, informative, application';
COMMENT ON COLUMN notifications.title IS 'Título de la notificación';
COMMENT ON COLUMN notifications.description IS 'Descripción detallada de la notificación';
COMMENT ON COLUMN notifications.was_read IS 'Indica si la notificación ha sido leída';
COMMENT ON COLUMN notifications.date IS 'Fecha y hora de creación de la notificación';

-- Ejemplo de inserción de datos de prueba (opcional)
-- Descomenta las siguientes líneas para insertar datos de prueba

/*
INSERT INTO notifications (notificationid, userid, type, title, description, was_read, date)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'user-123', 'warning', 
     'Advertencia de Seguridad', 
     'Se ha detectado un intento de acceso no autorizado a tu cuenta', 
     FALSE, CURRENT_TIMESTAMP),
    
    ('550e8400-e29b-41d4-a716-446655440002', 'user-123', 'success', 
     'Proyecto Creado', 
     'Tu proyecto "Mi Nuevo Proyecto" ha sido creado exitosamente', 
     FALSE, CURRENT_TIMESTAMP),
    
    ('550e8400-e29b-41d4-a716-446655440003', 'user-123', 'informative', 
     'Actualización del Sistema', 
     'El sistema se actualizará el próximo lunes a las 2:00 AM', 
     FALSE, CURRENT_TIMESTAMP),
    
    ('550e8400-e29b-41d4-a716-446655440004', 'user-123', 'application', 
     'Nueva Aplicación a Proyecto', 
     'Un usuario ha aplicado a tu proyecto "Desarrollo Web"', 
     FALSE, CURRENT_TIMESTAMP);
*/

-- Verificar que la tabla se creó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'notifications'
ORDER BY 
    ordinal_position;

-- Verificar índices creados
SELECT 
    indexname, 
    indexdef
FROM 
    pg_indexes
WHERE 
    tablename = 'notifications';

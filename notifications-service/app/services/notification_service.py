import logging
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationType
from app.schemas.notification import NotificationCreate, NotificationResponse, KafkaNotificationEvent
from app.database import get_database

logger = logging.getLogger(__name__)


class NotificationService:
    """Servicio de negocio para notificaciones"""
    
    def __init__(self, db: Session = None):
        self.db = db
    
    def create_notification(self, notification_create: NotificationCreate, db: Session) -> Notification:
        """Crea una nueva notificación"""
        notification_id = str(uuid.uuid4())
        
        notification = Notification(
            notificationid=notification_id,
            userid=notification_create.userid,
            type=notification_create.type,
            title=notification_create.title,
            description=notification_create.description,
            was_read=False,
            date=datetime.utcnow(),
            related_project_id=notification_create.related_project_id,
            related_user_id=notification_create.related_user_id,
            related_task_id=notification_create.related_task_id
        )
        
        db.add(notification)
        db.commit()
        db.refresh(notification)
        logger.info(f"Notificación creada: {notification_id}")
        
        return notification
    
    def get_user_notifications(self, userid: str, db: Session) -> List[Notification]:
        """Obtiene las notificaciones de un usuario"""
        notifications = db.query(Notification).filter(
            Notification.userid == userid
        ).order_by(Notification.date.desc()).all()
        
        return notifications
    
    def mark_as_read(self, userid: str, notificationid: str, db: Session) -> Optional[Notification]:
        """Marca una notificación como leída"""
        notification = db.query(Notification).filter(
            Notification.notificationid == notificationid,
            Notification.userid == userid
        ).first()
        
        if notification:
            notification.was_read = True
            db.commit()
            db.refresh(notification)
            logger.info(f"Notificación marcada como leída: {notificationid}")
            return notification
        
        return None
    
    def delete_notification(self, userid: str, notificationid: str, db: Session) -> bool:
        """Elimina una notificación"""
        notification = db.query(Notification).filter(
            Notification.notificationid == notificationid,
            Notification.userid == userid
        ).first()
        
        if notification:
            db.delete(notification)
            db.commit()
            logger.info(f"Notificación eliminada: {notificationid}")
            return True
        
        return False
    
    def process_kafka_event(self, event: dict) -> Optional[Notification]:
        """Procesa un evento de Kafka y crea una notificación"""
        try:
            kafka_event = KafkaNotificationEvent(**event)
            
            notification_create = NotificationCreate(
                userid=kafka_event.user_id,
                type=kafka_event.notification_type,
                title=kafka_event.title,
                description=kafka_event.message,
                related_project_id=kafka_event.related_project_id,
                related_user_id=kafka_event.related_user_id,
                related_task_id=kafka_event.related_task_id
            )
            
            # Necesitamos una sesión de DB para esto
            from app.database import SessionLocal
            if SessionLocal:
                db = SessionLocal()
                try:
                    return self.create_notification(notification_create, db)
                finally:
                    db.close()
            
            return None
        except Exception as e:
            logger.error(f"Error procesando evento de Kafka: {str(e)}")
            raise

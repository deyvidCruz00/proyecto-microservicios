from sqlalchemy import Column, String, DateTime, Boolean, Enum as SQLEnum, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()


class NotificationType(str, enum.Enum):
    """Tipos de notificación permitidos"""
    WARNING = "warning"
    SUCCESS = "success"
    INFORMATIVE = "informative"
    APPLICATION = "application"


class Notification(Base):
    """Modelo de notificación"""
    __tablename__ = "notifications"
    
    notificationid = Column(String(36), primary_key=True, index=True, name="notificationid")
    userid = Column(String(36), index=True, nullable=False, name="userid")
    type = Column(SQLEnum(NotificationType), nullable=False)  # warning, success, informative, application
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    was_read = Column(Boolean, default=False, index=True, name="was_read")
    date = Column(DateTime, default=datetime.utcnow, name="date")
    
    # Campos adicionales opcionales para tracking
    related_project_id = Column(String(36), nullable=True, index=True)
    related_user_id = Column(String(36), nullable=True)
    related_task_id = Column(String(36), nullable=True)

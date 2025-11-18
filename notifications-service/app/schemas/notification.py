from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class NotificationType(str, Enum):
    """Tipos de notificación permitidos"""
    WARNING = "warning"
    SUCCESS = "success"
    INFORMATIVE = "informative"
    APPLICATION = "application"


class NotificationCreate(BaseModel):
    """Schema para crear una notificación"""
    userid: str = Field(..., description="ID del usuario que recibe la notificación")
    type: NotificationType = Field(..., description="Tipo de notificación: warning, success, informative, application")
    title: str = Field(..., description="Título de la notificación")
    description: str = Field(..., description="Descripción de la notificación")
    related_project_id: Optional[str] = None
    related_user_id: Optional[str] = None
    related_task_id: Optional[str] = None


class NotificationResponse(BaseModel):
    """Schema de respuesta de notificación"""
    notificationid: str
    title: str
    description: str
    type: str
    date: datetime
    wasRead: bool
    
    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    """Schema de respuesta para lista de notificaciones"""
    success: bool
    message: str
    body: dict


class NotificationMarkReadRequest(BaseModel):
    """Schema para marcar notificación como leída"""
    userid: str = Field(..., description="ID del usuario")
    notificationid: str = Field(..., description="ID de la notificación")


class NotificationDeleteRequest(BaseModel):
    """Schema para eliminar una notificación"""
    userid: str = Field(..., description="ID del usuario")
    notificationid: str = Field(..., description="ID de la notificación")


class KafkaNotificationEvent(BaseModel):
    """Schema para eventos de Kafka"""
    event_type: str
    user_id: str
    notification_type: NotificationType
    title: str
    message: str
    timestamp: datetime
    related_project_id: Optional[str] = None
    related_user_id: Optional[str] = None
    related_task_id: Optional[str] = None

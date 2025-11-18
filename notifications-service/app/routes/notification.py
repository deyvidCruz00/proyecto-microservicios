from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.schemas.notification import (
    NotificationResponse, 
    NotificationCreate,
    NotificationListResponse,
    NotificationMarkReadRequest,
    NotificationDeleteRequest
)
from app.services.notification_service import NotificationService
from app.database import get_database

router = APIRouter(prefix="/notifications", tags=["notifications"])

# Instancia del servicio
notification_service = NotificationService()


@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    userid: str = Query(..., description="ID del usuario"),
    db: Session = Depends(get_database)
):
    """
    Obtiene las notificaciones del usuario
    
    Nota: La autenticación debe ser manejada por el backend Java.
    Este endpoint confía en que el backend ya validó al usuario.
    """
    try:
        notifications = notification_service.get_user_notifications(userid, db)
        
        # Convertir las notificaciones al formato requerido
        notifications_list = [
            {
                "notificationid": n.notificationid,
                "title": n.title,
                "description": n.description,
                "type": n.type.value if hasattr(n.type, 'value') else n.type,
                "date": n.date.isoformat(),
                "wasRead": n.was_read
            }
            for n in notifications
        ]
        
        return NotificationListResponse(
            success=True,
            message="Notificaciones obtenidas exitosamente",
            body={"notifications": notifications_list}
        )
    except Exception as e:
        return NotificationListResponse(
            success=False,
            message=f"Error al obtener notificaciones: {str(e)}",
            body={"notifications": []}
        )


@router.patch("/read")
async def mark_notification_as_read(
    request: NotificationMarkReadRequest,
    db: Session = Depends(get_database)
):
    """
    Marca una notificación como leída
    
    Nota: La autenticación debe ser manejada por el backend Java.
    Este endpoint confía en que el backend ya validó al usuario.
    """
    result = notification_service.mark_as_read(request.userid, request.notificationid, db)
    
    if not result:
        return {
            "success": False,
            "message": "Notificación no encontrada"
        }
    
    return {
        "success": True,
        "message": "Notificación marcada como leída"
    }


@router.delete("")
async def delete_notification(
    request: NotificationDeleteRequest,
    db: Session = Depends(get_database)
):
    """
    Elimina una notificación
    
    Nota: La autenticación debe ser manejada por el backend Java.
    Este endpoint confía en que el backend ya validó al usuario.
    """
    result = notification_service.delete_notification(request.userid, request.notificationid, db)
    
    if not result:
        return {
            "success": False,
            "message": "Notificación no encontrada"
        }
    
    return {
        "success": True,
        "message": "Notificación eliminada exitosamente"
    }


@router.get("/health", tags=["health"])
async def health_check():
    """Verificación de salud del servicio"""
    return {
        "status": "healthy",
        "service": "notifications-service"
    }

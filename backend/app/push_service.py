import json
import logging
from typing import Optional
from pywebpush import webpush, WebPushException
from app.config import settings

logger = logging.getLogger(__name__)

class PushService:
    def __init__(self):
        self.vapid_private_key = settings.VAPID_PRIVATE_KEY
        self.vapid_public_key = settings.VAPID_PUBLIC_KEY
        self.vapid_subject = settings.VAPID_SUBJECT
    
    def send_notification(
        self,
        subscription: dict,
        title: str,
        body: str,
        data: Optional[dict] = None,
        icon: Optional[str] = None,
        badge: Optional[str] = None,
        tag: Optional[str] = None,
        require_interaction: bool = False,
    ) -> bool:
        """Send a push notification to a subscription."""
        if not self.vapid_private_key or not self.vapid_public_key:
            logger.warning("VAPID keys not configured, skipping push notification")
            return False
        
        payload = {
            "title": title,
            "body": body,
            "icon": icon or "/icon-192.png",
            "badge": badge or "/icon-192.png",
            "data": data or {},
            "requireInteraction": require_interaction,
        }
        
        if tag:
            payload["tag"] = tag
        
        try:
            webpush(
                subscription_info=subscription,
                data=json.dumps(payload),
                vapid_private_key=self.vapid_private_key,
                vapid_claims={"sub": self.vapid_subject},
            )
            logger.info(f"Push notification sent successfully")
            return True
        except WebPushException as e:
            logger.error(f"WebPush error: {e}")
            if e.response and e.response.status_code == 410:
                # Subscription expired or invalid
                logger.info("Subscription expired (410), should be removed")
            return False
        except Exception as e:
            logger.error(f"Failed to send push notification: {e}")
            return False
    
    def send_pulse_notification(
        self,
        subscription: dict,
        pulse_summary: str,
        pulse_category: str,
        pulse_urgency: str,
        pulse_id: str,
    ) -> bool:
        """Send a notification for a new pulse."""
        urgency_icons = {
            "Critical": "🔴",
            "High": "🟠",
            "Medium": "🔵",
            "Low": "🟢",
        }
        urgency_labels = {
            "Critical": "Critical",
            "High": "High",
            "Medium": "Medium",
            "Low": "Low",
        }
        
        icon = urgency_icons.get(pulse_urgency, "📍")
        urgency_label = urgency_labels.get(pulse_urgency, pulse_urgency)
        
        return self.send_notification(
            subscription=subscription,
            title=f"{icon} New {pulse_category} Pulse",
            body=pulse_summary,
            data={
                "type": "pulse",
                "pulseId": pulse_id,
                "category": pulse_category,
                "urgency": pulse_urgency,
                "url": f"/?pulse={pulse_id}",
            },
            tag=f"pulse-{pulse_id}",
            require_interaction=pulse_urgency in ("Critical", "High"),
        )
    
    def send_pod_notification(
        self,
        subscription: dict,
        pod_topic: str,
        pod_course: str,
        pod_id: str,
    ) -> bool:
        """Send a notification for a study pod match/join."""
        return self.send_notification(
            subscription=subscription,
            title="📚 Study Pod Update",
            body=f"New match for {pod_course}: {pod_topic}",
            data={
                "type": "pod",
                "podId": pod_id,
                "course": pod_course,
                "topic": pod_topic,
                "url": f"/?tab=pods&pod={pod_id}",
            },
            tag=f"pod-{pod_id}",
        )

push_service = PushService()
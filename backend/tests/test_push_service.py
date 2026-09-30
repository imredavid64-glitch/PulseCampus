import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.push_service import PushService, push_service
from app.config import settings


class TestPushService:
    """Tests for push notification service."""

    def test_send_notification_returns_false_without_vapid_keys(self):
        """Test that notification fails gracefully without VAPID keys."""
        with patch('app.push_service.settings') as mock_settings:
            mock_settings.VAPID_PRIVATE_KEY = ""
            mock_settings.VAPID_PUBLIC_KEY = ""
            mock_settings.VAPID_SUBJECT = "mailto:test@test.com"
            
            service = PushService()
            result = service.send_notification(
                subscription={"endpoint": "test", "keys": {}},
                title="Test",
                body="Test body"
            )
            
            assert result is False

    def test_send_pulse_notification_formats_correctly(self):
        """Test that pulse notification formats with correct icons."""
        with patch('app.push_service.settings') as mock_settings:
            mock_settings.VAPID_PRIVATE_KEY = "test-key"
            mock_settings.VAPID_PUBLIC_KEY = "test-public"
            mock_settings.VAPID_SUBJECT = "mailto:test@test.com"
            
            service = PushService()
            
            with patch.object(service, 'send_notification', return_value=True) as mock_send:
                service.send_pulse_notification(
                    subscription={"endpoint": "test", "keys": {}},
                    pulse_summary="Need TI-84",
                    pulse_category="BorrowGear",
                    pulse_urgency="High",
                    pulse_id="pulse-123"
                )
                
                mock_send.assert_called_once()
                call_args = mock_send.call_args
                assert call_args[1]['title'] == "🟠 New BorrowGear Pulse"
                assert call_args[1]['body'] == "Need TI-84"
                assert call_args[1]['data']['type'] == "pulse"
                assert call_args[1]['data']['urgency'] == "High"
                assert call_args[1]['require_interaction'] is True

    def test_send_pod_notification_formats_correctly(self):
        """Test that pod notification formats correctly."""
        with patch('app.push_service.settings') as mock_settings:
            mock_settings.VAPID_PRIVATE_KEY = "test-key"
            mock_settings.VAPID_PUBLIC_KEY = "test-public"
            mock_settings.VAPID_SUBJECT = "mailto:test@test.com"
            
            service = PushService()
            
            with patch.object(service, 'send_notification', return_value=True) as mock_send:
                service.send_pod_notification(
                    subscription={"endpoint": "test", "keys": {}},
                    pod_topic="Midterm Review",
                    pod_course="CS 101",
                    pod_id="pod-123"
                )
                
                mock_send.assert_called_once()
                call_args = mock_send.call_args
                assert call_args[1]['title'] == "📚 Study Pod Update"
                assert "CS 101" in call_args[1]['body']
                assert call_args[1]['data']['type'] == "pod"
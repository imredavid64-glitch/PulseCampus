import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.ai_engine import parse_pulse, match_pods
from app.schemas import PulseCategory, UrgencyLevel, AIParseResponse


class TestAIEngine:
    """Tests for AI engine functions."""

    @pytest.mark.asyncio
    async def test_parse_pulse_returns_fallback_on_error(self):
        """Test that parse_pulse returns fallback when Gemini fails."""
        with patch('app.ai_engine.client') as mock_client:
            mock_client.models.generate_content.side_effect = Exception("API Error")
            
            result = await parse_pulse("Test pulse", "Library")
            
            assert result.category == PulseCategory.GENERAL_HELP
            assert result.urgency == UrgencyLevel.MEDIUM
            assert result.is_safe is True
            assert result.expiration_minutes == 60

    @pytest.mark.asyncio
    async def test_match_pods_returns_empty_for_no_pods(self):
        """Test that match_pods returns empty list when no pods provided."""
        result = await match_pods(
            user_skills=["Python"],
            needed_skills=["Recursion"],
            course_code="CS 101",
            pods=[]
        )
        
        assert result == []

    @pytest.mark.asyncio
    async def test_match_pods_fallback_scoring(self):
        """Test fallback matching algorithm."""
        pods = [
            {
                "id": "pod-1",
                "course_code": "CS 101",
                "strong_skills": ["Python", "Recursion"],
                "needed_skills": ["Arrays"],
            },
            {
                "id": "pod-2",
                "course_code": "CS 101",
                "strong_skills": ["Java", "Arrays"],
                "needed_skills": ["Python"],
            },
        ]
        
        with patch('app.ai_engine.client') as mock_client:
            mock_client.models.generate_content.side_effect = Exception("API Error")
            
            result = await match_pods(
                user_skills=["Python", "Arrays"],
                needed_skills=["Recursion"],
                course_code="CS 101",
                pods=pods
            )
        
        assert len(result) == 2
        # Both should have some match score
        assert all(r["match_score"] > 0 for r in result)


class TestSchemas:
    """Tests for Pydantic schemas."""

    def test_pulse_category_enum(self):
        assert PulseCategory.ACADEMIC == "Academic"
        assert PulseCategory.BORROW_GEAR == "BorrowGear"
        assert PulseCategory.FOOD_SHARING == "FoodSharing"
        assert PulseCategory.SAFETY_ESCORT == "SafetyEscort"
        assert PulseCategory.GENERAL_HELP == "GeneralHelp"

    def test_urgency_level_enum(self):
        assert UrgencyLevel.LOW == "Low"
        assert UrgencyLevel.MEDIUM == "Medium"
        assert UrgencyLevel.HIGH == "High"
        assert UrgencyLevel.CRITICAL == "Critical"

    def test_ai_parse_response_validation(self):
        """Test AIParseResponse validates correctly."""
        response = AIParseResponse(
            category=PulseCategory.ACADEMIC,
            summary="Need help with homework",
            urgency=UrgencyLevel.HIGH,
            item_or_action_needed="Textbook",
            expiration_minutes=60,
            is_safe=True,
            safety_reason=None
        )
        
        assert response.category == PulseCategory.ACADEMIC
        assert response.urgency == UrgencyLevel.HIGH
        assert response.expiration_minutes == 60

    def test_ai_parse_response_expiration_validation(self):
        """Test expiration minutes validation."""
        with pytest.raises(ValueError):
            AIParseResponse(
                category=PulseCategory.ACADEMIC,
                summary="Test",
                urgency=UrgencyLevel.HIGH,
                expiration_minutes=10,  # Too low
            )
        
        with pytest.raises(ValueError):
            AIParseResponse(
                category=PulseCategory.ACADEMIC,
                summary="Test",
                urgency=UrgencyLevel.HIGH,
                expiration_minutes=400,  # Too high
            )
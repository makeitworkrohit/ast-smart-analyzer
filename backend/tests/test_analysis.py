"""Interpretation endpoint tests (/interpret)."""
import os
# pyrefly: ignore [missing-import]
import pytest

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "http://localhost:8000").rstrip("/")


class TestAnalysis:
    """Image interpretation endpoints."""

    def test_interpret_with_valid_data(self, api_client, auth_headers):
        """Test POST /api/interpret returns interpretation, MIC, organisms."""
        response = api_client.post(
            f"{BASE_URL}/api/interpret",
            json={
                "zone_mm": 22.0,
                "antibiotic": "Ciprofloxacin",
                "antibiotic_category": "Fluoroquinolones",
                "sample_type": "Urine"
            },
            headers=auth_headers,
            timeout=30  # AI call may take time
        )
        assert response.status_code == 200, f"Interpret failed: {response.text}"
        
        data = response.json()
        # Check required fields
        assert "interpretation" in data
        assert data["interpretation"] in ["Sensitive", "Intermediate", "Resistant"]
        
        assert "estimated_mic_range" in data
        assert isinstance(data["estimated_mic_range"], str)
        
        assert "possible_organisms" in data
        assert isinstance(data["possible_organisms"], list)
        
        # Each organism should have name and confidence
        for org in data["possible_organisms"]:
            assert "name" in org
            assert "confidence" in org
            assert 0.0 <= org["confidence"] <= 1.0
        
        assert "explanation" in data
        assert isinstance(data["explanation"], str)
        
        assert "confidence_score" in data
        assert 0.0 <= data["confidence_score"] <= 1.0
        
        print(f"✓ Interpret returned {data['interpretation']}, {len(data['possible_organisms'])} organisms")

    def test_interpret_without_auth(self, api_client):
        """Test /api/interpret without auth returns 401."""
        response = api_client.post(
            f"{BASE_URL}/api/interpret",
            json={
                "zone_mm": 22.0,
                "antibiotic": "Ciprofloxacin",
                "antibiotic_category": "Fluoroquinolones",
                "sample_type": "Urine"
            }
        )
        assert response.status_code == 401
        print("✓ Interpret without auth returns 401")


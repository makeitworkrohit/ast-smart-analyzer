"""Health check and basic connectivity tests."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "http://localhost:8000").rstrip("/")


class TestHealth:
    """Basic connectivity and health checks."""

    def test_root_endpoint(self, api_client):
        """Test GET /api/ returns service info."""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "service" in data
        assert data["service"] == "ast-smart-analyzer"
        assert data["status"] == "ok"
        print("✓ Root endpoint working")

"""Metadata endpoint tests (antibiotics, sample types)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "http://localhost:8000").rstrip("/")


class TestMeta:
    """Metadata endpoints for antibiotics and sample types."""

    def test_get_antibiotics(self, api_client):
        """Test GET /api/meta/antibiotics returns 14 categories."""
        response = api_client.get(f"{BASE_URL}/api/meta/antibiotics")
        assert response.status_code == 200
        
        data = response.json()
        assert "categories" in data
        categories = data["categories"]
        
        # Should have 14 categories
        assert len(categories) >= 14, f"Expected 14+ categories, got {len(categories)}"
        
        # Check specific categories exist
        assert "Penicillins & Combinations" in categories
        assert "Carbapenems" in categories
        assert "Fluoroquinolones" in categories
        
        # Check Penicillins & Combinations contains expected antibiotics
        penicillins = categories["Penicillins & Combinations"]
        assert "Penicillin" in penicillins
        assert "Amoxicillin-clavulanate" in penicillins
        
        # Check Carbapenems contains Meropenem
        carbapenems = categories["Carbapenems"]
        assert "Meropenem" in carbapenems
        
        print(f"✓ Antibiotics endpoint returns {len(categories)} categories")

    def test_get_sample_types(self, api_client):
        """Test GET /api/meta/sample-types returns expected types."""
        response = api_client.get(f"{BASE_URL}/api/meta/sample-types")
        assert response.status_code == 200
        
        data = response.json()
        assert "sample_types" in data
        types = data["sample_types"]
        
        # Check expected types
        assert "Urine" in types
        assert "Blood" in types
        assert "Sputum" in types
        assert "Other" in types
        
        print(f"✓ Sample types endpoint returns {len(types)} types")

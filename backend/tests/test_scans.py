"""Scans CRUD and user isolation tests."""
import os
import pytest
import requests
import uuid

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "http://localhost:8000").rstrip("/")


class TestScans:
    """Scans CRUD operations and user isolation."""

    def test_create_scan(self, api_client, auth_headers):
        """Test POST /api/scans creates scan and returns it with id."""
        scan_data = {
            "zone_mm": 18.5,
            "sample_type": "Urine",
            "antibiotic": "Ciprofloxacin",
            "antibiotic_category": "Fluoroquinolones",
            "interpretation": "Sensitive",
            "estimated_mic_range": "<= 1 mcg/mL",
            "possible_organisms": [{"name": "E. coli", "confidence": 0.85}],
            "explanation": "Test scan",
            "confidence_score": 0.8,
            "detection_mode": "hybrid"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/scans",
            json=scan_data,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Create scan failed: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["zone_mm"] == 18.5
        assert data["antibiotic"] == "Ciprofloxacin"
        assert data["interpretation"] == "Sensitive"
        assert "timestamp" in data
        assert "user_id" in data
        
        print(f"✓ Created scan {data['id']}")

    def test_list_scans(self, api_client, auth_headers):
        """Test GET /api/scans returns user's scans without base64 images."""
        # Create a test scan first
        scan_data = {
            "zone_mm": 20.0,
            "sample_type": "Blood",
            "antibiotic": "Meropenem",
            "antibiotic_category": "Carbapenems",
            "interpretation": "Resistant",
            "estimated_mic_range": ">= 32 mcg/mL",
            "possible_organisms": [],
            "explanation": "Test",
            "confidence_score": 0.7,
            "image_base64": "data:image/jpeg;base64,test123",
            "annotated_base64": "data:image/jpeg;base64,test456"
        }
        api_client.post(f"{BASE_URL}/api/scans", json=scan_data, headers=auth_headers)
        
        # List scans
        response = api_client.get(f"{BASE_URL}/api/scans", headers=auth_headers)
        assert response.status_code == 200, f"List scans failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            # Check that base64 images are NOT included in list
            scan = data[0]
            assert scan["image_base64"] is None
            assert scan["annotated_base64"] is None
            print(f"✓ List scans returned {len(data)} scans (images trimmed)")
        else:
            print("✓ List scans returned empty list")

    def test_get_scan_by_id(self, api_client, auth_headers):
        """Test GET /api/scans/{id} returns full scan including images."""
        # Create scan
        scan_data = {
            "zone_mm": 15.0,
            "sample_type": "Sputum",
            "antibiotic": "Amoxicillin",
            "antibiotic_category": "Penicillins & Combinations",
            "interpretation": "Intermediate",
            "estimated_mic_range": "4-8 mcg/mL",
            "possible_organisms": [],
            "explanation": "Test",
            "confidence_score": 0.6,
            "image_base64": "data:image/jpeg;base64,original123",
            "annotated_base64": "data:image/jpeg;base64,annotated456"
        }
        create_resp = api_client.post(
            f"{BASE_URL}/api/scans",
            json=scan_data,
            headers=auth_headers
        )
        scan_id = create_resp.json()["id"]
        
        # Get by ID
        response = api_client.get(f"{BASE_URL}/api/scans/{scan_id}", headers=auth_headers)
        assert response.status_code == 200, f"Get scan failed: {response.text}"
        
        data = response.json()
        assert data["id"] == scan_id
        assert data["zone_mm"] == 15.0
        # Images should be included
        assert data["image_base64"] == "data:image/jpeg;base64,original123"
        assert data["annotated_base64"] == "data:image/jpeg;base64,annotated456"
        
        print(f"✓ Get scan {scan_id} returned full data with images")

    def test_delete_scan(self, api_client, auth_headers):
        """Test DELETE /api/scans/{id} deletes scan, subsequent GET returns 404."""
        # Create scan
        scan_data = {
            "zone_mm": 25.0,
            "sample_type": "Urine",
            "antibiotic": "Gentamicin",
            "antibiotic_category": "Aminoglycosides",
            "interpretation": "Sensitive",
            "estimated_mic_range": "<= 2 mcg/mL",
            "possible_organisms": [],
            "explanation": "Test",
            "confidence_score": 0.9
        }
        create_resp = api_client.post(
            f"{BASE_URL}/api/scans",
            json=scan_data,
            headers=auth_headers
        )
        scan_id = create_resp.json()["id"]
        
        # Delete
        del_resp = api_client.delete(f"{BASE_URL}/api/scans/{scan_id}", headers=auth_headers)
        assert del_resp.status_code == 200
        assert del_resp.json()["deleted"] is True
        
        # Verify deleted
        get_resp = api_client.get(f"{BASE_URL}/api/scans/{scan_id}", headers=auth_headers)
        assert get_resp.status_code == 404
        
        print(f"✓ Deleted scan {scan_id}, GET returns 404")

    def test_clear_all_scans(self, api_client, auth_headers):
        """Test DELETE /api/scans clears all user scans."""
        # Create 2 scans
        for i in range(2):
            scan_data = {
                "zone_mm": 10.0 + i,
                "sample_type": "Other",
                "antibiotic": f"Test{i}",
                "antibiotic_category": "Others / Special",
                "interpretation": "Resistant",
                "estimated_mic_range": "N/A",
                "possible_organisms": [],
                "explanation": "Test",
                "confidence_score": 0.5
            }
            api_client.post(f"{BASE_URL}/api/scans", json=scan_data, headers=auth_headers)
        
        # Clear all
        clear_resp = api_client.delete(f"{BASE_URL}/api/scans", headers=auth_headers)
        assert clear_resp.status_code == 200
        deleted_count = clear_resp.json()["deleted"]
        assert deleted_count >= 2
        
        # Verify empty
        list_resp = api_client.get(f"{BASE_URL}/api/scans", headers=auth_headers)
        assert len(list_resp.json()) == 0
        
        print(f"✓ Cleared {deleted_count} scans")

    def test_user_isolation(self, api_client):
        """Test scans for user A are not visible to user B."""
        # Create user A
        email_a = f"TEST_userA_{uuid.uuid4().hex[:8]}@example.com"
        reg_a = api_client.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email_a, "password": "test1234"}
        )
        token_a = reg_a.json()["token"]
        headers_a = {"Authorization": f"Bearer {token_a}"}
        
        # Create user B
        email_b = f"TEST_userB_{uuid.uuid4().hex[:8]}@example.com"
        reg_b = api_client.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email_b, "password": "test1234"}
        )
        token_b = reg_b.json()["token"]
        headers_b = {"Authorization": f"Bearer {token_b}"}
        
        # User A creates a scan
        scan_data = {
            "zone_mm": 30.0,
            "sample_type": "Blood",
            "antibiotic": "Vancomycin",
            "antibiotic_category": "Glycopeptides",
            "interpretation": "Sensitive",
            "estimated_mic_range": "<= 4 mcg/mL",
            "possible_organisms": [],
            "explanation": "User A scan",
            "confidence_score": 0.95
        }
        create_resp = api_client.post(
            f"{BASE_URL}/api/scans",
            json=scan_data,
            headers=headers_a
        )
        scan_id_a = create_resp.json()["id"]
        
        # User B tries to access user A's scan
        get_resp = api_client.get(f"{BASE_URL}/api/scans/{scan_id_a}", headers=headers_b)
        assert get_resp.status_code == 404, "User B should not see user A's scan"
        
        # User B lists scans (should be empty or not include A's scan)
        list_resp = api_client.get(f"{BASE_URL}/api/scans", headers=headers_b)
        scans_b = list_resp.json()
        scan_ids_b = [s["id"] for s in scans_b]
        assert scan_id_a not in scan_ids_b, "User A's scan should not appear in user B's list"
        
        print("✓ User isolation verified: user B cannot access user A's scans")

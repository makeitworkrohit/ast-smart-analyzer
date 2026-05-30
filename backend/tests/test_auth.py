"""Authentication endpoint tests."""
import os
import pytest
import requests
import uuid

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "http://localhost:8000").rstrip("/")


class TestAuth:
    """Authentication flows: register, login, me."""

    def test_register_new_user(self, api_client):
        """Test POST /api/auth/register creates user and returns token."""
        email = f"TEST_user_{uuid.uuid4().hex[:8]}@example.com"
        response = api_client.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "test1234", "name": "Test User"}
        )
        assert response.status_code == 200, f"Register failed: {response.text}"
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == email.lower()
        assert data["user"]["name"] == "Test User"
        assert "id" in data["user"]
        print(f"✓ Register created user {email}")

    def test_register_duplicate_email(self, api_client):
        """Test registering same email twice returns 400."""
        email = f"TEST_dup_{uuid.uuid4().hex[:8]}@example.com"
        api_client.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "test1234"}
        )
        # Try again
        response = api_client.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "test1234"}
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
        print("✓ Duplicate email rejected")

    def test_login_success(self, api_client):
        """Test POST /api/auth/login with correct credentials."""
        response = api_client.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@example.com", "password": "test1234"}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == "test@example.com"
        print("✓ Login successful")

    def test_login_wrong_password(self, api_client):
        """Test login with wrong password returns 401."""
        response = api_client.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@example.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()
        print("✓ Wrong password rejected with 401")

    def test_login_nonexistent_user(self, api_client):
        """Test login with non-existent email returns 401."""
        response = api_client.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "nonexistent@example.com", "password": "test1234"}
        )
        assert response.status_code == 401
        print("✓ Non-existent user rejected")

    def test_me_with_token(self, api_client, auth_headers):
        """Test GET /api/auth/me with Bearer token returns user profile."""
        response = api_client.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200, f"/me failed: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert data["email"] == "test@example.com"
        print("✓ /auth/me returns user profile")

    def test_me_without_token(self, api_client):
        """Test GET /api/auth/me without token returns 401."""
        response = api_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ /auth/me without token returns 401")

    def test_me_with_invalid_token(self, api_client):
        """Test GET /api/auth/me with invalid token returns 401."""
        response = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_xyz"}
        )
        assert response.status_code == 401
        print("✓ Invalid token rejected")

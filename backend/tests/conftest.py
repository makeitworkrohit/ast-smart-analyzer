"""Shared pytest fixtures for AST Smart Analyzer backend tests."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "http://localhost:8000").rstrip("/")


@pytest.fixture
def api_client():
    """Shared requests session."""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def auth_token(api_client):
    """Get auth token for test@example.com user (or create if needed)."""
    # Try login first
    resp = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "test@example.com", "password": "test1234"}
    )
    if resp.status_code == 200:
        return resp.json()["token"]
    
    # If login fails, register
    resp = api_client.post(
        f"{BASE_URL}/api/auth/register",
        json={"email": "test@example.com", "password": "test1234", "name": "Test"}
    )
    if resp.status_code == 200:
        return resp.json()["token"]
    
    pytest.skip("Cannot authenticate test user")


@pytest.fixture
def auth_headers(auth_token):
    """Bearer token headers."""
    return {"Authorization": f"Bearer {auth_token}"}

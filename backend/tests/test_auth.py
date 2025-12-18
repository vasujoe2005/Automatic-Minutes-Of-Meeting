import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    """Test user registration."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "testpassword123"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """Test that duplicate email registration fails."""
    user_data = {
        "name": "Test User",
        "email": "duplicate@example.com",
        "password": "testpassword123"
    }
    
    # First registration should succeed
    response1 = await client.post("/api/v1/auth/register", json=user_data)
    assert response1.status_code == 201
    
    # Second registration with same email should fail
    response2 = await client.post("/api/v1/auth/register", json=user_data)
    assert response2.status_code == 400
    assert "already registered" in response2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """Test successful login."""
    # First register a user
    await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Login Test",
            "email": "login@example.com",
            "password": "testpassword123"
        }
    )
    
    # Then login
    response = await client.post(
        "/api/v1/auth/login",
        data={
            "username": "login@example.com",
            "password": "testpassword123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    """Test login with invalid credentials."""
    response = await client.post(
        "/api/v1/auth/login",
        data={
            "username": "nonexistent@example.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient):
    """Test getting current user info."""
    # Register and login
    await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Current User",
            "email": "current@example.com",
            "password": "testpassword123"
        }
    )
    
    login_response = await client.post(
        "/api/v1/auth/login",
        data={
            "username": "current@example.com",
            "password": "testpassword123"
        }
    )
    token = login_response.json()["access_token"]
    
    # Get current user
    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "current@example.com"
    assert data["name"] == "Current User"

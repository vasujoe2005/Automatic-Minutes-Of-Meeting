import pytest
from httpx import AsyncClient


async def get_auth_token(client: AsyncClient) -> str:
    """Helper to register and login a user, returning the auth token."""
    await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Meeting Host",
            "email": "host@example.com",
            "password": "testpassword123"
        }
    )
    
    login_response = await client.post(
        "/api/v1/auth/login",
        data={
            "username": "host@example.com",
            "password": "testpassword123"
        }
    )
    return login_response.json()["access_token"]


@pytest.mark.asyncio
async def test_create_meeting(client: AsyncClient):
    """Test creating a new meeting."""
    token = await get_auth_token(client)
    
    response = await client.post(
        "/api/v1/meetings/meetings",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert "meeting_id" in data
    assert "meeting_code" in data
    assert len(data["meeting_code"]) == 8


@pytest.mark.asyncio
async def test_get_meeting(client: AsyncClient):
    """Test retrieving a meeting by code."""
    token = await get_auth_token(client)
    
    # Create a meeting
    create_response = await client.post(
        "/api/v1/meetings/meetings",
        headers={"Authorization": f"Bearer {token}"}
    )
    meeting_code = create_response.json()["meeting_code"]
    
    # Get the meeting
    response = await client.get(
        f"/api/v1/meetings/meetings/{meeting_code}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["meeting_code"] == meeting_code
    assert "host_id" in data


@pytest.mark.asyncio
async def test_get_nonexistent_meeting(client: AsyncClient):
    """Test retrieving a meeting that doesn't exist."""
    token = await get_auth_token(client)
    
    response = await client.get(
        "/api/v1/meetings/meetings/INVALID1",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 404

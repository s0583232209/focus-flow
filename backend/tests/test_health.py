"""Tests for the /health endpoint and global error handlers."""

import pytest


@pytest.mark.asyncio
async def test_health_returns_200_and_ok(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_unknown_route_returns_404_with_message(client):
    response = await client.get("/this-route-does-not-exist")
    assert response.status_code == 404
    body = response.json()
    assert "message" in body


@pytest.mark.asyncio
async def test_unknown_api_route_returns_404_with_message(client):
    response = await client.get("/api/does-not-exist")
    assert response.status_code == 404
    body = response.json()
    assert "message" in body


@pytest.mark.asyncio
async def test_health_response_has_no_extra_fields(client):
    response = await client.get("/health")
    assert set(response.json().keys()) == {"status"}

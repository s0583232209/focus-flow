"""Tests for the /health endpoint and global error handlers."""
# טסטים לנתיב /health ולפורמט השגיאות הכללי.

import pytest  # ספריית הטסטים


@pytest.mark.asyncio  # מסמן שזה טסט אסינכרוני
async def test_health_returns_200_and_ok(client):  # client מגיע מ-conftest.py (pytest מזריק לפי השם)
    response = await client.get("/health")  # שולחים GET
    assert response.status_code == 200  # assert = "חייב להיות נכון", אחרת הטסט נכשל
    assert response.json() == {"status": "ok"}  # הגוף בדיוק כמו שהמטלה דורשת


@pytest.mark.asyncio
async def test_unknown_route_returns_404_with_message(client):
    response = await client.get("/this-route-does-not-exist")  # נתיב שלא קיים
    assert response.status_code == 404
    body = response.json()
    assert "message" in body  # השגיאה בפורמט שלנו (message), לא detail


@pytest.mark.asyncio
async def test_unknown_api_route_returns_404_with_message(client):
    response = await client.get("/api/does-not-exist")  # גם נתיב לא קיים מתחת ל-/api
    assert response.status_code == 404
    body = response.json()
    assert "message" in body


@pytest.mark.asyncio
async def test_health_response_has_no_extra_fields(client):
    response = await client.get("/health")
    assert set(response.json().keys()) == {"status"}  # רק השדה status, בלי שדות נוספים

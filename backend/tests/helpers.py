"""Small helpers shared by the API tests."""

PW = "Passw0rd123"


async def register(client, email="alice@test.com", pw=PW, display_name="Alice"):
    return await client.post(
        "/api/auth/register",
        json={"email": email, "password": pw, "display_name": display_name},
    )


async def login(client, email="alice@test.com", pw=PW):
    return await client.post("/api/auth/login", json={"email": email, "password": pw})


async def auth_headers(client, email="alice@test.com", pw=PW):
    """Register (if needed) and log in; returns the Authorization header."""
    await register(client, email, pw)
    response = await login(client, email, pw)
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}

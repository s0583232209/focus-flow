"""Small helpers shared by the API tests."""
# פונקציות עזר קטנות שחוסכות לכתוב שוב ושוב את אותן בקשות בכל טסט.

PW = "Passw0rd123"  # סיסמת ברירת מחדל שעומדת בכל כללי החוזק


# שולחת בקשת הרשמה. לכל הפרמטרים יש ברירת מחדל, אז אפשר פשוט לכתוב await register(client)
async def register(client, email="alice@test.com", pw=PW, display_name="Alice"):
    return await client.post(  # POST עם גוף JSON
        "/api/auth/register",
        json={"email": email, "password": pw, "display_name": display_name},
    )


# שולחת בקשת התחברות ומחזירה את התשובה (בלי לבדוק אותה)
async def login(client, email="alice@test.com", pw=PW):
    return await client.post("/api/auth/login", json={"email": email, "password": pw})


async def auth_headers(client, email="alice@test.com", pw=PW):
    """Register (if needed) and log in; returns the Authorization header."""
    await register(client, email, pw)  # נרשמים (אם המשתמש כבר קיים יחזור 409, וזה בסדר)
    response = await login(client, email, pw)  # מתחברים
    assert response.status_code == 200, response.text  # אם ההתחברות נכשלה – הטסט נעצר ומדפיס את התשובה
    # מחזירים כותרת מוכנה לשימוש: {"Authorization": "Bearer <token>"}
    return {"Authorization": f"Bearer {response.json()['access_token']}"}

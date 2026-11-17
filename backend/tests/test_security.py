"""Unit tests for password and token helpers. No database needed."""
# טסטי יחידה לפונקציות הסיסמה והטוקן. הם בודקים פונקציות ישירות, בלי שרת ובלי מסד.

import time  # הזמן הנוכחי בשניות
import uuid  # מזהים ייחודיים
from datetime import datetime, timezone  # תאריכים לבדיקת iso()

import jwt  # ליצירת טוקנים ידנית
import pytest  # ספריית הטסטים
from fastapi import HTTPException  # השגיאה שהפונקציות זורקות

from app.config import get_settings  # הסוד ומשך התוקף
from app.schemas.users import UserOut, to_user_out  # לבדוק שאין password_hash בפלט
from app.security import (  # הפונקציות שנבדקות
    create_access_token,
    decode_token,
    hash_password,
    validate_password_strength,
    verify_password,
)
from app.utils import iso, parse_object_id  # פונקציות העזר שנבדקות

GOOD_PW = "Passw0rd123"  # סיסמה תקינה


def claims(**overrides):  # בונה תוכן טוקן תקין; אפשר לשנות שדות, ו-None מוחק שדה
    now = int(time.time())
    base = {"sub": "0" * 24, "ver": 0, "jti": str(uuid.uuid4()), "iat": now, "exp": now + 600}
    base.update(overrides)  # דורסים את השדות שהועברו
    return {k: v for k, v in base.items() if v is not None}  # משאירים רק שדות שאינם None


def sign(payload, secret=None):  # חותם על תוכן; ברירת מחדל – הסוד האמיתי
    return jwt.encode(payload, secret or get_settings().JWT_SECRET, algorithm="HS256")


def test_hash_and_verify():  # הצפנה ובדיקה
    hashed = hash_password(GOOD_PW)
    assert hashed.startswith("$2b$12$")  # bcrypt עם cost 12
    assert GOOD_PW not in hashed  # הסיסמה המקורית לא מופיעה ב-hash
    assert verify_password(GOOD_PW, hashed)  # הסיסמה הנכונה עוברת


def test_wrong_password_is_rejected():  # סיסמה שגויה נדחית
    assert not verify_password("Wrong1234", hash_password(GOOD_PW))


def test_password_over_72_bytes_never_verifies():  # סיסמה ארוכה מ-72 בתים תמיד נדחית
    assert not verify_password("a1" * 40, hash_password(GOOD_PW))  # 80 בתים


@pytest.mark.parametrize(  # parametrize מריץ את אותו טסט פעם אחת לכל ערך ברשימה
    "password",
    [
        "abc1",  # קצרה מדי
        "a1" * 37,  # 74 בתים – ארוכה מדי
        "א" * 36 + "1",  # 73 בתים בפחות מ-72 תווים (כל אות עברית = 2 בתים)
        "abcdefghij",  # בלי ספרה
        "1234567890",  # בלי אות
        "dana12345",  # מכילה את השם מהאימייל
        "xDANA12345",  # אותו דבר, באותיות גדולות
    ],
)
def test_weak_passwords_get_422(password):
    with pytest.raises(HTTPException) as err:  # מצפים שתיזרק שגיאה; err שומר אותה
        validate_password_strength(password, "dana@test.com")
    assert err.value.status_code == 422
    assert err.value.detail  # יש הודעה


@pytest.mark.parametrize("password", [GOOD_PW, "a1" * 36, "abcd1234"])  # סיסמאות תקינות (כולל בדיוק 72 בתים)
def test_strong_passwords_pass(password):
    validate_password_strength(password, "dana@test.com")  # לא אמורה להיזרק שגיאה


def test_very_short_email_name_does_not_forbid_every_password():  # שם של אות אחת ("a") לא נבדק
    validate_password_strength("abcd1234", "a@test.com")  # אחרת כל סיסמה עם a הייתה נפסלת


def test_token_round_trip():  # יצירה ופענוח מחזירים את אותו תוכן
    token, expires_in = create_access_token("user1", 3)
    assert expires_in == get_settings().JWT_EXPIRE_MINUTES * 60
    decoded = decode_token(token)
    assert decoded["sub"] == "user1"
    assert decoded["ver"] == 3
    assert decoded["exp"] - decoded["iat"] == expires_in  # ההפרש בין התפוגה ליצירה = משך התוקף
    assert decoded["jti"]  # יש מזהה ייחודי


def test_each_token_has_its_own_jti():  # כל טוקן עם מזהה אחר
    a, _ = create_access_token("user1", 0)
    b, _ = create_access_token("user1", 0)
    assert decode_token(a)["jti"] != decode_token(b)["jti"]  # כך התנתקות מבטלת רק טוקן אחד


def assert_rejected(token):  # פונקציית עזר: מוודאת שהטוקן נדחה ב-401
    with pytest.raises(HTTPException) as err:
        decode_token(token)
    assert err.value.status_code == 401
    assert err.value.detail == "Invalid or expired token"


def test_expired_token_is_rejected():  # פג תוקף לפני 5 שניות
    assert_rejected(sign(claims(exp=int(time.time()) - 5)))


def test_token_signed_with_another_secret_is_rejected():  # נחתם בסוד אחר
    assert_rejected(sign(claims(), secret="another-secret-another-secret-12345"))


@pytest.mark.parametrize("missing", ["sub", "jti", "exp", "ver"])  # טסט נפרד לכל שדה חובה
def test_token_with_missing_claim_is_rejected(missing):
    assert_rejected(sign(claims(**{missing: None})))  # None מוחק את השדה מהטוקן


def test_garbage_token_is_rejected():  # טקסט שהוא לא טוקן
    assert_rejected("garbage")


def test_alg_none_token_is_rejected():  # התקפה מוכרת: טוקן "בלי חתימה" (alg: none)
    assert_rejected(jwt.encode(claims(), key="", algorithm="none"))


def test_user_out_has_no_password_hash():  # ההמרה לתשובה מסננת את ה-hash
    doc = {  # מסמך משתמש מלא, כמו במסד
        "_id": "abc",
        "email": "a@test.com",
        "email_lower": "a@test.com",
        "password_hash": "$2b$12$secret",
        "display_name": "A",
        "token_version": 0,
        "created_at": datetime(2026, 1, 2, 3, 4, 5, tzinfo=timezone.utc),
    }
    dumped = to_user_out(doc).model_dump()  # model_dump ממיר את הסכמה למילון
    assert "password_hash" not in UserOut.model_fields  # אין שדה כזה בסכמה בכלל
    assert "password_hash" not in dumped  # ולא בתוצאה
    assert dumped["id"] == "abc"  # _id הפך ל-id


def test_parse_object_id_invalid_is_404():  # מזהה לא תקין → 404
    with pytest.raises(HTTPException) as err:
        parse_object_id("abc")
    assert err.value.status_code == 404


def test_parse_object_id_valid():  # מזהה תקין (24 תווים הקסדצימליים)
    assert str(parse_object_id("0" * 24)) == "0" * 24


def test_iso_format():  # פורמט התאריך
    aware = datetime(2026, 1, 2, 3, 4, 5, 678900, tzinfo=timezone.utc)  # עם אזור זמן
    assert iso(aware) == "2026-01-02T03:04:05.678Z"  # מילישניות בשלוש ספרות ו-Z
    assert iso(aware.replace(tzinfo=None)) == "2026-01-02T03:04:05.678Z"  # גם בלי אזור זמן (כמו מ-Mongo) – אותה תוצאה

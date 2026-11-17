# נתיבי הפרופיל של המשתמש המחובר: צפייה, שינוי שם, החלפת סיסמה ומחיקת חשבון. כולם מתחת ל-/api/users.

import asyncio  # להרצת bcrypt בתהליכון נפרד

from fastapi import APIRouter, Depends, HTTPException, Response, status  # כלי FastAPI
from pydantic import BaseModel  # מחלקת בסיס לסכמות הקלט
from pymongo.asynchronous.database import AsyncDatabase  # טיפוס המסד

from app.db import get_db  # תלות: המסד
from app.deps import CurrentUser, get_current_user  # תלות: המשתמש המחובר
from app.schemas.users import DisplayName, UserOut, to_user_out  # טיפוס שם תצוגה, סכמת פלט, והמרה בטוחה
from app.security import hash_password, validate_password_strength, verify_password  # פונקציות סיסמה

router = APIRouter(prefix="/api/users", tags=["users"])  # כל הנתיבים כאן מתחילים ב-/api/users


class ProfileIn(BaseModel):  # גוף הבקשה לשינוי שם
    display_name: DisplayName  # 1–50 תווים אחרי הסרת רווחים


class PasswordIn(BaseModel):  # גוף הבקשה להחלפת סיסמה
    current_password: str  # הסיסמה הנוכחית – כדי לוודא שזה באמת בעל החשבון
    new_password: str  # הסיסמה החדשה


@router.get("/me", response_model=UserOut)  # GET /api/users/me; response_model מסנן את התשובה לשדות של UserOut
async def get_me(current: CurrentUser = Depends(get_current_user)):  # בלי טוקן תקין לא מגיעים לכאן בכלל (401)
    return to_user_out(current.doc)  # המשתמש כבר נטען ב-get_current_user, רק ממירים לתשובה


@router.patch("/me", response_model=UserOut)  # PATCH = עדכון חלקי
async def update_me(
    body: ProfileIn,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    await db.users.update_one(  # עדכון מסמך אחד במסד
        {"_id": current.doc["_id"]}, {"$set": {"display_name": body.display_name}}  # מסנן לפי המשתמש מהטוקן; $set משנה רק את השדה הזה
    )
    # מחזירים את המשתמש עם השם החדש. {**a, "x": 1} יוצר עותק של המילון עם שדה אחד מוחלף (בלי פנייה נוספת למסד)
    return to_user_out({**current.doc, "display_name": body.display_name})


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)  # הצלחה = 204
async def change_password(
    body: PasswordIn,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    matches = await asyncio.to_thread(  # בודקים את הסיסמה הנוכחית (bcrypt איטי → בתהליכון נפרד)
        verify_password, body.current_password, current.doc["password_hash"]
    )
    if not matches:  # הסיסמה הנוכחית שגויה
        raise HTTPException(status_code=400, detail="Current password is incorrect")  # 400 = בקשה שגויה
    validate_password_strength(body.new_password, current.doc["email"])  # אותם כללי חוזק כמו בהרשמה
    new_hash = await asyncio.to_thread(hash_password, body.new_password)  # הצפנת הסיסמה החדשה
    # token_version עולה ב-1, ולכן כל טוקן שנוצר לפני הרגע הזה (גם במכשירים אחרים) מפסיק לעבוד
    await db.users.update_one(
        {"_id": current.doc["_id"]},
        {"$set": {"password_hash": new_hash}, "$inc": {"token_version": 1}},  # $inc = הוספה למספר
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)  # מחיקת החשבון
async def delete_me(
    current: CurrentUser = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    # מוחקים את כל הנתונים של המשתמש, ולא רק אותו – אחרת יישארו במסד נתונים "יתומים"
    await db.sessions.delete_many({"owner_id": current.id})  # כל הסשנים שלו
    await db.content.delete_many({"owner_id": current.id})  # כל התוכן שלו
    await db.login_attempts.delete_many({"email_lower": current.doc["email_lower"]})  # ניסיונות ההתחברות (שמורים לפי אימייל)
    await db.users.delete_one({"_id": current.doc["_id"]})  # ולבסוף המשתמש עצמו
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# סכמות (Pydantic) של משתמשים: איך נראה הקלט שמגיע מהלקוח, ואיך נראית התשובה שחוזרת אליו.
# FastAPI בודק את הקלט מול הסכמה אוטומטית, ומחזיר 422 אם משהו לא תקין.

from typing import Annotated  # מאפשר "להצמיד" כללי בדיקה לטיפוס

from pydantic import BaseModel, EmailStr, StringConstraints  # מחלקת בסיס לסכמה, טיפוס אימייל מאומת, ואילוצים על מחרוזת

from app.utils import iso  # פורמט תאריך ל-ISO עם Z

# טיפוס לשם תצוגה: מחרוזת שמסירים ממנה רווחים בקצוות, ואחר כך היא חייבת להיות באורך 1 עד 50.
# כך שם שכולו רווחים נדחה. מגדירים פעם אחת ומשתמשים בהרשמה ובעדכון פרופיל
DisplayName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]


class RegisterIn(BaseModel):  # גוף הבקשה בהרשמה
    email: EmailStr  # חייב להיות אימייל בפורמט תקין (נבדק בעזרת הספרייה email-validator)
    password: str  # הסיסמה; את החוזק בודקים בנפרד ב-validate_password_strength
    display_name: DisplayName  # שם תצוגה לפי הכללים שלמעלה


class LoginIn(BaseModel):  # גוף הבקשה בהתחברות
    email: EmailStr
    password: str


class UserOut(BaseModel):  # מה שמחזירים ללקוח על משתמש – שימו לב שאין כאן סיסמה או hash
    id: str  # המזהה כמחרוזת (בשם id, לא _id)
    email: str
    display_name: str
    created_at: str  # תאריך כמחרוזת ISO עם Z


def to_user_out(doc: dict) -> UserOut:
    """The only way a user document becomes a response, so password_hash can never leak."""
    # זו הדרך היחידה שבה מסמך משתמש מהמסד הופך לתשובה. בוחרים רק שדות מותרים,
    # ולכן password_hash לעולם לא יכול "לדלוף" ללקוח בטעות
    return UserOut(
        id=str(doc["_id"]),  # ObjectId → מחרוזת
        email=doc["email"],  # האימייל כפי שהמשתמש הקליד (לא בהכרח באותיות קטנות)
        display_name=doc["display_name"],
        created_at=iso(doc["created_at"]),  # datetime → "2026-11-10T14:03:05.123Z"
    )

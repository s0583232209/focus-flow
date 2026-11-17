# קובץ ההגדרות של השרת. כל הערכים (כתובת המסד, סוד ה-JWT וכו') מגיעים ממשתני סביבה,
# ולא כתובים בקוד. כך אותו קוד רץ מקומית, אצל הבודק ובענן – רק משתני הסביבה משתנים.

from functools import lru_cache  # דקורטור ששומר תוצאה של פונקציה, כדי לא לחשב אותה שוב בכל קריאה
from typing import Annotated  # כלי לרמזי טיפוס (לא בשימוש כרגע בקובץ הזה)

from pydantic import field_validator  # דקורטור להגדרת בדיקה מותאמת אישית על שדה אחד
from pydantic_settings import BaseSettings, SettingsConfigDict  # מחלקת בסיס שקוראת שדות ממשתני סביבה


# כל שדה במחלקה הזו נקרא אוטומטית ממשתנה סביבה באותו שם.
# שדה בלי ערך ברירת מחדל הוא חובה – אם הוא חסר, השרת לא יעלה בכלל (fail fast).
class Settings(BaseSettings):
    MONGO_URL: str  # כתובת החיבור ל-MongoDB (חובה). מקומית: mongodb://mongodb:27017, בענן: Atlas
    MONGO_DB: str = "focusflow"  # שם המסד בתוך MongoDB; ברירת מחדל focusflow
    JWT_SECRET: str  # הסוד שבעזרתו חותמים על טוקני ההתחברות (חובה, לפחות 32 תווים)
    JWT_EXPIRE_MINUTES: int = 60  # כמה דקות טוקן תקף; pydantic ממיר את הטקסט ממשתנה הסביבה למספר
    CORS_ORIGINS: str  # רשימת אתרים (מופרדת בפסיקים) שמותר להם לפנות לשרת מהדפדפן
    GEMINI_API_KEY: str = ""  # מפתח ל-Gemini (בונוס); ריק = הפיצ'ר כבוי

    # הגדרות לקריאה: אפשר לקרוא גם מקובץ .env, בקידוד UTF-8, ומשתנים לא מוכרים פשוט מתעלמים מהם
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("JWT_SECRET")  # הפונקציה הבאה תרוץ על השדה JWT_SECRET בזמן יצירת ההגדרות
    @classmethod  # validator ב-pydantic חייב להיות מתודת מחלקה
    def jwt_secret_must_be_strong(cls, v: str) -> str:  # v הוא הערך שהגיע ממשתנה הסביבה
        if not v or len(v) < 32:  # סוד ריק או קצר קל לנחש – ואז אפשר לזייף טוקנים
            raise ValueError(  # זריקת שגיאה עוצרת את עליית השרת עם הודעה ברורה
                "JWT_SECRET must be set and at least 32 characters long. "
                "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(48))\""
            )
        return v  # הערך תקין – מחזירים אותו כמו שהוא

    @property  # מאפשר לגשת לפונקציה כמו לשדה: settings.cors_origins_list (בלי סוגריים)
    def cors_origins_list(self) -> list[str]:
        # מפצלים לפי פסיק, מסירים רווחים, ומדלגים על פריטים ריקים (למשל פסיק בסוף)
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache  # בפעם הראשונה יוצרים את Settings, ובכל פעם אחר כך מקבלים את אותו אובייקט מהזיכרון
def get_settings() -> Settings:
    return Settings()  # יצירת האובייקט = קריאת כל משתני הסביבה והרצת הבדיקות

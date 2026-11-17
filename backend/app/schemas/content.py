# סכמות של פריטי תוכן בספרייה (סרטון YouTube או טקסט).

from typing import Annotated, Literal  # Annotated – להצמיד כללים לטיפוס; Literal – רק ערכים מסוימים מותרים

from pydantic import BaseModel, StringConstraints  # מחלקת בסיס לסכמה, ואילוצים על מחרוזת

from app.utils import iso  # פורמט תאריך

LIST_PREVIEW_LENGTH = 200  # ברשימת הספרייה טקסט ארוך נחתך ל-200 תווים, כדי שהרשימה תיטען מהר

# כותרת: בלי רווחים בקצוות, באורך 1 עד 200 תווים
Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]


class ContentIn(BaseModel):  # גוף הבקשה בהוספת פריט
    title: Title  # הכותרת
    type: Literal["youtube", "text"]  # רק אחד משני הערכים האלה; כל ערך אחר (למשל "pdf") → 422
    source: str  # הקישור לסרטון או הטקסט עצמו; נבדק בנתיב בעזרת content_validation


class ContentOut(BaseModel):  # מה שמחזירים ללקוח על פריט
    id: str
    title: str
    type: str
    source: str  # הקישור, או הטקסט (מלא או מקוצר – תלוי בנתיב)
    video_id: str | None  # מזהה הסרטון (11 תווים) בסרטון; None בטקסט. כך הלקוח לא צריך לפענח קישורים
    created_at: str


def to_content_out(doc: dict, preview: bool = False) -> ContentOut:
    source = doc["source"]  # התוכן המלא מהמסד
    if preview and doc["type"] == "text":  # ברשימה (preview=True) ורק לטקסט
        source = source[:LIST_PREVIEW_LENGTH]  # חיתוך ל-200 התווים הראשונים
    return ContentOut(
        id=str(doc["_id"]),  # ObjectId → מחרוזת
        title=doc["title"],
        type=doc["type"],
        source=source,
        video_id=doc.get("video_id"),  # get מחזיר None אם השדה לא קיים (בפריט טקסט)
        created_at=iso(doc["created_at"]),
    )

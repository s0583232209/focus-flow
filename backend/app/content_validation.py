# קובץ זה בודק שהתוכן שהמשתמש מוסיף לספרייה תקין: קישור YouTube או טקסט לקריאה.
# הבדיקה נעשית בשרת (ולא רק בדפדפן), כי אי אפשר לסמוך על מה שהלקוח שולח.

import re  # ספריית ביטויים רגולריים (regex) – לבדיקת תבנית של מחרוזת
from urllib.parse import parse_qs, urlparse  # urlparse מפרק קישור לחלקים; parse_qs מפרק את החלק שאחרי "?"

# רשימה סגורה של שמות שרת מותרים. משתמשים ב-set כי בדיקת "האם קיים" בו מהירה.
# בגלל שזו התאמה מדויקת, כתובת כמו youtube.com.evil.com לא תעבור.
YOUTUBE_HOSTS = {"youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"}
# תבנית למזהה סרטון: בדיוק 11 תווים – אותיות באנגלית, ספרות, קו תחתון או מקף.
# ^ = תחילת המחרוזת, $ = סוף המחרוזת, כך ששום תו נוסף לא יכול "להסתתר" לפני או אחרי.
# re.compile מכין את התבנית פעם אחת מראש, כדי לא לבנות אותה מחדש בכל קריאה.
VIDEO_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")

MIN_TEXT_LENGTH = 20  # אורך מינימלי לטקסט (בתווים), אחרי הסרת רווחים בקצוות
MAX_TEXT_LENGTH = 100_000  # אורך מקסימלי לטקסט. הקו התחתון רק מקל על הקריאה: 100000


# מקבלת קישור ומחזירה את מזהה הסרטון (str), או None אם זה לא קישור YouTube תקין.
# "str | None" הוא רמז טיפוס (type hint) – לא משנה את ההרצה, רק מתעד מה חוזר.
def extract_youtube_id(url: str) -> str | None:
    """Return the 11 character video id, or None for anything that is not a YouTube video link."""
    try:  # מנסים לפרק את הקישור; קישור משובש מאוד יכול לזרוק שגיאה
        parsed = urlparse(url.strip())  # strip מסיר רווחים בקצוות; urlparse מחזיר אובייקט עם scheme, hostname, path, query
        host = parsed.hostname  # שם השרת באותיות קטנות, בלי פורט (למשל "www.youtube.com")
    except ValueError:  # אם הקישור לא תקין (למשל פורט לא חוקי) – תופסים את השגיאה
        return None  # ומחזירים "לא תקין" במקום לקרוס

    # מאשרים רק http/https (חוסם למשל "javascript:") ורק שרתים מהרשימה המותרת
    if parsed.scheme not in ("http", "https") or host not in YOUTUBE_HOSTS:
        return None  # אחד התנאים נכשל – הקישור נדחה

    # מפרקים את הנתיב לפי "/" ומסננים חלקים ריקים.
    # לדוגמה: "/shorts/abc" -> ["", "shorts", "abc"] -> אחרי הסינון ["shorts", "abc"]
    parts = [part for part in parsed.path.split("/") if part]
    candidate = None  # "מועמד" למזהה הסרטון; נשאר None אם אף פורמט לא מתאים
    if host == "youtu.be":  # קישור מקוצר: https://youtu.be/<id>
        candidate = parts[0] if len(parts) == 1 else None  # המזהה הוא החלק היחיד בנתיב; אחרת – לא תקין
    elif parts == ["watch"]:  # קישור רגיל: https://www.youtube.com/watch?v=<id>
        # parse_qs מחזיר מילון שבו כל ערך הוא רשימה, למשל {"v": ["abc"]}.
        # get("v", [None]) מחזיר [None] אם אין פרמטר v, ו-[0] לוקח את הערך הראשון.
        candidate = parse_qs(parsed.query).get("v", [None])[0]
    elif len(parts) == 2 and parts[0] in ("shorts", "embed"):  # https://www.youtube.com/shorts/<id> או /embed/<id>
        candidate = parts[1]  # המזהה הוא החלק השני בנתיב

    # מחזירים את המועמד רק אם הוא קיים וגם מתאים לתבנית של 11 תווים; אחרת None
    return candidate if candidate and VIDEO_ID.match(candidate) else None


# מקבלת טקסט ומחזירה אותו בלי רווחים בקצוות, או None אם האורך לא בטווח המותר
def validate_text(text: str) -> str | None:
    """Return the stripped text, or None if its length is out of range."""
    stripped = text.strip()  # מסירים רווחים ושורות ריקות מההתחלה ומהסוף, כדי שרווחים לא "ייספרו"
    # השוואה משורשרת בפייתון: בודקת שהאורך גם >= 20 וגם <= 100000 באותה שורה
    return stripped if MIN_TEXT_LENGTH <= len(stripped) <= MAX_TEXT_LENGTH else None

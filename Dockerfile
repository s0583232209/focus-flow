# מתכון לבניית תמונת Docker של השרת. כל פקודה יוצרת "שכבה"; שכבות שלא השתנו נלקחות מה-cache.

# תמונת בסיס: פייתון 3.12 בגרסה מצומצמת (slim) – קטנה ומהירה להורדה
FROM python:3.12-slim

# יוצרים משתמש רגיל (לא root). אם מישהו יפרוץ לקונטיינר, לא יהיו לו הרשאות מנהל
RUN useradd --create-home --uid 1000 appuser

# תיקיית העבודה בתוך הקונטיינר; כל הפקודות הבאות רצות ממנה
WORKDIR /app

# מעתיקים קודם רק את רשימת הספריות ומתקינים אותן.
# כך, כששינינו רק קוד, שכבת ההתקנה (האיטית) נלקחת מה-cache והבנייה מהירה
COPY requirements.txt .
# --no-cache-dir: לא שומרים את קבצי ההורדה של pip – התמונה קטנה יותר
RUN pip install --no-cache-dir -r requirements.txt

# עכשיו מעתיקים את קוד האפליקציה (בלי טסטים ובלי .env – ראו .dockerignore)
COPY backend/app/ ./app/

# מכאן והלאה הקונטיינר רץ כמשתמש הרגיל
USER appuser

# תיעוד: השרת מאזין בפורט 8000
EXPOSE 8000

# הפקודה שרצה כשהקונטיינר עולה: uvicorn מריץ את app מתוך app/main.py.
# 0.0.0.0 = מקבל חיבורים מחוץ לקונטיינר. --proxy-headers ו---forwarded-allow-ips
# נחוצים בענן, שם השרת יושב מאחורי מאזן עומסים, כדי שיידע את הכתובת והפרוטוקול (https) המקוריים
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips=*"]

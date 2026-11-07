# REQUIREMENTS.md: requirements map for assignments 3 and 4

Every requirement in the briefs, the task that delivers it, and where it gets checked.

## MISSING: requirements with no task in TASKS.md

These rows have no task. Per T00, none were invented here. The team decides on each one, adds a task to TASKS.md in a separate PR, and then updates the row here.

| Row | Requirement | Type | Points |
| --- | --- | --- | --- |
| #110 | UML diagrams that the team prepares | Unclear if required; see the row's note | Not graded |
| #122 | Email confirmation on registration | Optional bonus | Up to 4 |
| #128 | Server-side model over WebSocket | Optional bonus | Up to 4 |
| #129 | Plugin (browser extension or app add-on) | Optional bonus | 30 |
| #152 | Cloud steps for groups whose client is a plugin | Applies only if the plugin replaces the client | None |

## Open questions (these rows have tasks, but need a human)

1. **`PROJECT_INFO.docx` template is not in the repo.** Only `PROJECT_INFO.pdf` is in `docs/assignment/`. A3 lists a `.docx` template as attached, and the graded file must be a `.docx` with unchanged field names and rows (#100, #101, #105). T28 and T29 expect `docs/assignment/PROJECT_INFO_template.docx`. Get the original before T28.
2. **Neither brief gives a date.** A3 says the schedule will be explained in class, A4 says its date is the same as A3's, and the grading window reads "[תאריכים ימולאו בהמשך]" (#107, #165, #166). T38 tells us to find the deadline in the briefs, so the team has to get the dates from the course staff.
3. **Error format differs from the brief.** A3 specifies `{"detail": "message"}`, while CLAUDE.md, T04 and the merged code use `{"message": "..."}` (#33). A3 allows changing routes and field names as long as behavior is kept, because the grader only goes through the client. Keep it only if T29 declares it in `changes_to_recommended_api`.

## How to read this file

- **Sources:** A3 = `docs/assignment/FocusFlow_Assignment3.pdf`, A4 = `docs/assignment/FocusFlow_Assignment4.pdf`, PI = `docs/assignment/PROJECT_INFO.pdf`. The text after the dot is the section name.
- **Points:** only on rows the briefs score directly. A dash means the requirement counts through a graded row. The A4 grading table gives no points per row.
- **Task(s):** IDs from `TASKS.md`. "Packaging only" or similar notes say where a task covers only part of a requirement.
- **Checked in:** "ACCEPTANCE: x" is the row of that name in `docs/ACCEPTANCE.md`, which T29 creates. "T13 check" is the "איך בודקים" section of that task.
- **Not mapped:** ideas and advice in the briefs that are not requirements. These are the A3 chapter "רעיונות לתוספות וכיוונים", the suggestion to try face cropping, the recommended `/docs` page, and the VM, Cloud SQL and other options we did not choose.

## A3: base grading table (100 points)

| # | Requirement (short, quoted from the brief) | Source (file + section) | Points | Task(s) | Checked in |
| --- | --- | --- | --- | --- | --- |
| 1 | הפעלה: "docker compose up מעלה את המערכת, /health מחזיר 200, והאתר נטען ב-localhost:3000" | A3 · ניקוד הבסיס המשותף | 10 | T04, T05, T20, T28 | ACCEPTANCE: startup |
| 2 | הרשמה: "משתמש חדש נרשם בהצלחה. אימייל שכבר קיים וסיסמה קצרה מדי נדחים עם הודעה מובנת" | A3 · ניקוד הבסיס המשותף | 10 | T11, T18 | ACCEPTANCE: register |
| 3 | התחברות: "סיסמה שגויה מציגה הודעה ברורה, סיסמה נכונה מכניסה לאתר, ושם התצוגה מוצג" | A3 · ניקוד הבסיס המשותף | 10 | T11, T17, T18 | ACCEPTANCE: login |
| 4 | תוכן: "הוספת פריט מהסוג העיקרי שציינתם ב-PROJECT_INFO.docx, עם תוכן הדוגמה שסיפקתם. הוא מופיע בספרייה ונפתח" | A3 · ניקוד הבסיס המשותף | 14 | T13, T19, T26, T27, T29 | ACCEPTANCE: content |
| 5 | סשן ומדידה: "פתיחת סשן, הפעלת המצלמה אחרי הסכמה וצפייה של כחצי דקה בסרטון מוקלט של אדם ממוקד"; ציון מתעדכן, ו"אחרי סיום הסשן הוא מופיע בהיסטוריה עם ציון ממוצע" | A3 · ניקוד הבסיס המשותף | 26 | T14, T21, T23, T24, T25, T26, T27 | ACCEPTANCE: session + measurement |
| 6 | חוסר פנים: "כשהמצלמה מנגנת סרטון בלי פנים, מוצגת הודעה מתאימה והאתר ממשיך לעבוד" | A3 · ניקוד הבסיס המשותף | 8 | T24, T25, T27 | ACCEPTANCE: no face |
| 7 | הפרדה: "משתמש שני נרשם ורואה ספרייה ריקה, ופתיחת כתובת של פריט של המשתמש הראשון מציגה \"לא נמצא\"" | A3 · ניקוד הבסיס המשותף | 8 | T12, T13, T14, T19, T27 | ACCEPTANCE: user isolation |
| 8 | התנתקות: "התנתקות מחזירה למסך ההתחברות" | A3 · ניקוד הבסיס המשותף | 4 | T12, T17 | ACCEPTANCE: logout |
| 9 | בהירות: "כפתורים וטקסטים ברורים, הודעות שגיאה מובנות ומסלול ברור לכל פעולה" | A3 · ניקוד הבסיס המשותף | 5 | T16, T18, T19, T21, T25, T27, T29 | ACCEPTANCE: clarity |
| 10 | קבצי הגשה: "assignment3.zip במבנה הנכון, עם docker-compose.yml, .env ו-PROJECT_INFO.docx מלא" | A3 · ניקוד הבסיס המשותף | 5 | T28, T29, T37 | ACCEPTANCE: files |

**Base total: 10 + 10 + 10 + 14 + 26 + 8 + 8 + 4 + 5 + 5 = 100.**

## A3: general and technology

| # | Requirement (short, quoted from the brief) | Source (file + section) | Points | Task(s) | Checked in |
| --- | --- | --- | --- | --- | --- |
| 11 | "המטלה נעשית בקבוצות של 2 עד 3 מגישים (לא לבד)" | A3 · מטרת המטלה | — | T29, T30, T38 | T29 check (`authors`), T30 check (`members`) |
| 12 | "השרת נכתב ב-Python" | A3 · טכנולוגיות | — | T04 | T04 check |
| 13 | "כל המערכת רצה ב-Docker בשלושה קונטיינרים (לקוח, שרת ומסד נתונים) שמחוברים בקובץ docker-compose" | A3 · טכנולוגיות | — | T05, T20, T28 | T20 check; ACCEPTANCE: startup |
| 14 | לקוח "קונטיינר Docker, פורט 3000"; שרת "קונטיינר Docker, פורט 8000" | A3 · איך המערכת בנויה | — | T05, T20 | T05 check; T20 check |
| 15 | מסד נתונים: "קונטיינר Docker ... עם volume לשמירת הנתונים" | A3 · איך המערכת בנויה | — | T05, T28 | T05 check; T28 check |
| 16 | זרימת סשן: בחירת פריט, פתיחת סשן בשרת, הסכמה, חילוץ נקודות, חלון של 100 פריימים, שליחת הציון ושמירתו, הצגה מיידית, סיום והיסטוריה | A3 · זרימה של סשן צפייה | — | T14, T21, T24, T25, T27 | T27 check, steps 1–4 |
| 17 | "הווידאו עצמו לא עוזב את הדפדפן" | A3 · זרימה של סשן צפייה | — | T23, T25, T27 | T23 check; T29 check (`camera_and_face_data`) |
| 18 | "האתר צריך לעבוד איתה [מצלמה וירטואלית OBS] כמו עם מצלמה אמיתית" | A3 · כלל הברזל | — | T24, T25, T27 | T24 check (OBS); T27 check, step 13 |
| 19 | "הממשק צריך להיות ברור למי שמגיע אליו בפעם הראשונה" | A3 · כלל הברזל | — | T16, T18, T19, T25, T27, T29 | ACCEPTANCE: clarity |

## A3: backend requirements

| # | Requirement (short, quoted from the brief) | Source (file + section) | Points | Task(s) | Checked in |
| --- | --- | --- | --- | --- | --- |
| 20 | "השרת חושף API שמחזיר ומקבל JSON" | A3 · השרת | — | T04 | T04 check |
| 21 | "GET /health: שמחזיר 200 כשהשרת מוכן" (חייב להיות בדיוק כך) | A3 · השרת | — | T04 | T04 check |
| 22 | "מומלץ שכל הנתיבים יתחילו ב-/api" | A3 · השרת | — | T04, T11, T12, T13, T14, T15 | T04 check; T09 check |
| 23 | "זמנים מוחזרים בפורמט ISO 8601 (UTC), ומזהים (id) הם מחרוזות" | A3 · השרת | — | T10, T13, T14 | T10 check; T14 check |
| 24 | הרשמה: "אימייל, סיסמה ושם תצוגה. האימייל ייחודי (בלי הבדל בין אותיות גדולות לקטנות), והסיסמה באורך 8 תווים לפחות" | A3 · מערכת משתמשים | — | T10, T11 | T11 check |
| 25 | התחברות: "השרת מחזיר טוקן גישה (למשל JWT) עם תוקף מוגבל" | A3 · מערכת משתמשים | — | T10, T11 | T11 check |
| 26 | "הלקוח שולח אותו בכל בקשה בכותרת Authorization: Bearer <token>" | A3 · מערכת משתמשים | — | T17 | T17 check |
| 27 | "נתיב שמסומן \"מחובר\" דורש טוקן תקין, אחרת הוא מחזיר 401" | A3 · מערכת משתמשים | — | T12 | T12 check |
| 28 | "בקשה למשאב של משתמש אחר מחזירה 404" | A3 · מערכת משתמשים | — | T13, T14 | T13 check; T14 check |
| 29 | "הסיסמה נשמרת רק כ-Hash באמצעות אלגוריתם ייעודי (bcrypt או argon2), ולא מוחזרת בשום תגובה" | A3 · מערכת משתמשים | — | T10, T11 | T10 check; T11 check |
| 30 | "כתובת מסד הנתונים וכל סוד אחר מגיעים ממשתני סביבה, לא מהקוד" | A3 · מערכת משתמשים | — | T04 | T04 check |
| 31 | "חובה לתמוך לפחות בסוג אחד [של תוכן], ולציין אותו ב-PROJECT_INFO.docx" | A3 · תוכן, סשנים ומודל | — | T13, T29 | T13 check; T29 check |
| 32 | סשן: "בתוך הסשן נשמרות מדידות (readings): מיקום בתוכן וציון. עם מודל הקשב הציון הוא בין 0 ל-1" | A3 · תוכן, סשנים ומודל | — | T14 | T14 check |
| 33 | "כל שגיאה מחזירה JSON בצורה {\"detail\": \"message\"}" עם 400, 401, 404, 409, 422. **We use `message`; see open question 3** | A3 · ה-API המומלץ | — | T04, T29 | T04 check; T29 check (`changes_to_recommended_api`) |
| 34 | משתמשים במסד: "אימייל (ייחודי), Hash של הסיסמה, שם תצוגה, תאריך יצירה" | A3 · מה נשמר במסד הנתונים | — | T10 | T10 check |
| 35 | תוכן במסד: "הבעלים, כותרת, סוג, מקור (קישור או טקסט), תאריך יצירה" | A3 · מה נשמר במסד הנתונים | — | T13 | T13 check |
| 36 | סשנים ומדידות במסד: "המשתמש, פריט התוכן, זמן התחלה וסיום, ורשימת המדידות (מיקום, ציון, זמן)" | A3 · מה נשמר במסד הנתונים | — | T14 | T14 check |
| 37 | "בשני המקרים השרת שומר את הציון" | A3 · תוכן, סשנים ומודל | — | T14 | T14 check |

## A3: recommended API behavior

A3 calls this table a recommendation and not a contract. Routes and fields may change if the client and server work together and the behavior stays the same.

| # | Requirement (short, quoted from the brief) | Source (file + section) | Points | Task(s) | Checked in |
| --- | --- | --- | --- | --- | --- |
| 38 | `GET /health`: 200, `{"status":"ok"}`, פתוח | A3 · ה-API המומלץ | — | T04 | T04 check |
| 39 | `POST /api/auth/register`: 201, "409 אם האימייל קיים. 422 אם הקלט לא תקין" | A3 · ה-API המומלץ | — | T11 | T11 check |
| 40 | `POST /api/auth/login`: 200, `access_token`, `token_type`, `expires_in`, "401 אם הפרטים שגויים" | A3 · ה-API המומלץ | — | T11 | T11 check |
| 41 | `POST /api/auth/logout`: 204 | A3 · ה-API המומלץ | — | T12 | T12 check |
| 42 | `GET /api/users/me`: 200, `id`, `email`, `display_name`, `created_at` | A3 · ה-API המומלץ | — | T12 | T12 check |
| 43 | `PATCH /api/users/me`: 200, "פרטי המשתמש המעודכנים" | A3 · ה-API המומלץ | — | T15 | T15 check |
| 44 | `POST /api/users/me/password`: 204, "400 אם הסיסמה הנוכחית שגויה" | A3 · ה-API המומלץ | — | T15 | T15 check |
| 45 | `DELETE /api/users/me`: 204, "מוחק גם את כל הנתונים של המשתמש" | A3 · ה-API המומלץ | — | T15 | T15 check |
| 46 | `POST /api/content`: 201, "422 אם הסוג לא נתמך או שהמקור לא תקין" | A3 · ה-API המומלץ | — | T13 | T13 check |
| 47 | `GET /api/content`: 200, "רשימת פריטי התוכן של המשתמש" | A3 · ה-API המומלץ | — | T13 | T13 check |
| 48 | `GET /api/content/{id}`: 200, "404 אם לא קיים או שאינו של המשתמש" | A3 · ה-API המומלץ | — | T13 | T13 check |
| 49 | `DELETE /api/content/{id}`: 204 | A3 · ה-API המומלץ | — | T13 | T13 check |
| 50 | `POST /api/sessions`: 201, `id`, `content_id`, `started_at` | A3 · ה-API המומלץ | — | T14 | T14 check |
| 51 | `POST /api/sessions/{id}/readings`: 201, "422 אם הקלט לא תקין. 409 אם הסשן נסגר" | A3 · ה-API המומלץ | — | T14 | T14 check |
| 52 | `POST /api/sessions/{id}/end`: 200, `ended_at`, `reading_count`, `average_score` | A3 · ה-API המומלץ | — | T14 | T14 check |
| 53 | `GET /api/sessions`: 200, "סיכום לכל אחד, כולל content_id ו-average_score" | A3 · ה-API המומלץ | — | T14 | T14 check |
| 54 | `GET /api/sessions/{id}`: 200, "סיכום הסשן, ובנוסף readings" | A3 · ה-API המומלץ | — | T14 | T14 check |

## A3: frontend requirements

| # | Requirement (short, quoted from the brief) | Source (file + section) | Points | Task(s) | Checked in |
| --- | --- | --- | --- | --- | --- |
| 55 | "הלקוח הוא אתר שרץ בדפדפן על פורט 3000" | A3 · הלקוח | — | T16, T20 | T20 check |
| 56 | מסך הרשמה: "שדות עם תוויות ברורות, כפתור הרשמה וקישור למי שכבר רשום"; "אחרי הצלחה עוברים להתחברות" | A3 · הלקוח (טבלת המסכים) | — | T18 | T18 check |
| 57 | מסך התחברות: "שדות ברורים, כפתור כניסה וקישור להרשמה. הודעה ברורה כשהפרטים שגויים. אחרי הצלחה עוברים לספרייה" | A3 · הלקוח (טבלת המסכים) | — | T18 | T18 check |
| 58 | מסך ספרייה: "רשימה עם כותרות הפריטים, הודעה כשהספרייה ריקה, טופס הוספה ברור, ואישור לפני מחיקה" | A3 · הלקוח (טבלת המסכים) | — | T19 | T19 check |
| 59 | מסך צפייה: "כפתור לפתיחת סשן, כפתור להפעלת המצלמה עם הסבר על מה נאסף, ציון הקשב הנוכחי שמוצג בבירור, הודעה כשלא זוהו פנים, התראה כשהקשב יורד, וכפתור לסיום הסשן" | A3 · הלקוח (טבלת המסכים) | — | T25, T27 | T27 check |
| 60 | מסך היסטוריה: "רשימה עם תאריך, שם התוכן וציון ממוצע. בלחיצה על סשן מוצגות המדידות שלו" | A3 · הלקוח (טבלת המסכים) | — | T21 | T21 check |
| 61 | "בכל מסך של משתמש מחובר יש קישורים לספרייה ולהיסטוריה, שם התצוגה וכפתור התנתקות" | A3 · התנהגות הלקוח | — | T17 | T17 check |
| 62 | "משתמש שלא מחובר מועבר להתחברות, וכך גם משתמש שהשרת החזיר לו 401" | A3 · התנהגות הלקוח | — | T17 | T17 check |
| 63 | "הטוקן נשמר כך שרענון הדף לא מתנתק" | A3 · התנהגות הלקוח | — | T17 | T17 check |
| 64 | "הלקוח מציג הודעה ברורה \"לא נמצא\", בלי מידע על הפריט" | A3 · התנהגות הלקוח | — | T21, T27 | T21 check; T27 check, step 11 |
| 65 | "כל סוג תוכן מוצג בתצוגה שמתאימה לו, ליד אזור המצלמה" | A3 · התנהגות הלקוח | — | T26, T27 | T26 check; T27 check |
| 66 | "המצלמה נדלקת רק אחרי שהמשתמש לחץ על כפתור ייעודי ואישר" | A3 · התנהגות הלקוח | — | T25 | T25 check |
| 67 | "אם הוא מסרב, אפשר להמשיך לצפות בלי מדידה, והאתר מסביר מה קרה" | A3 · התנהגות הלקוח | — | T25, T27 | T25 check; T27 check, step 6 |
| 68 | "MediaPipe רץ בדפדפן, ומחלץ נקודות פנים בקצב 10 פריימים לשנייה" | A3 · התנהגות הלקוח | — | T23, T24 | T24 check |
| 69 | "כל כמה שניות מריצים את המודל על חלון נע של 100 פריימים, והציון נשלח לשרת לשמירה" | A3 · התנהגות הלקוח | — | T24, T27 | T24 check; T27 check, step 1 |
| 70 | "הציון הראשון מופיע אחרי כעשר שניות" | A3 · התנהגות הלקוח | — | T24 | T24 check |
| 71 | "אם לא זוהו פנים, מציגים \"לא זוהו פנים\" ולא מריצים את המודל" | A3 · התנהגות הלקוח | — | T24, T25 | T24 check; T27 check, step 2 |
| 72 | "המצלמה יכולה להיות כל מצלמה שהדפדפן מזהה, כולל וירטואלית" | A3 · התנהגות הלקוח | — | T24, T25 | T25 check |
| 73 | "הציון האחרון מוצג בצורה בולטת, עם תווית שמסבירה מה הוא" | A3 · התנהגות הלקוח | — | T25 | T25 check |
| 74 | "כשהוא מצביע על בעיה (עם מודל הקשב, למשל מתחת ל-0.4) מופיעה התראה" | A3 · התנהגות הלקוח | — | T25, T27 | T25 check; T27 check, step 10 |
| 75 | "הלקוח פונה לשרת דרך כתובת שניתנת להגדרה (משתנה סביבה או קובץ הגדרות), לא כתובת קבועה בקוד" | A3 · התנהגות הלקוח | — | T16, T20 | T16 check; T20 check |
| 76 | "כפתורים וקישורים עם טקסט ברור, לא רק אייקון" | A3 · קריאות ושימושיות | — | T16, T17, T18, T19, T25, T27 | ACCEPTANCE: clarity |
| 77 | "כל פעולה מגיבה: רואים שהיא בתהליך, שהצליחה או שנכשלה, והודעות שגיאה מופיעות ליד הבעיה בשפה מובנת" | A3 · קריאות ושימושיות | — | T18, T19, T22, T27 | T18 check; T19 check |
| 78 | "טקסט קריא עם ניגודיות טובה, מסך לא עמוס, ואם הממשק בעברית, הוא מוצג מימין לשמאל" | A3 · קריאות ושימושיות | — | T16 | T16 check |
| 79 | "משתמש חדש מצליח להירשם, להוסיף תוכן, להתחיל סשן ולראות היסטוריה בלי הוראות" | A3 · קריאות ושימושיות | — | T18, T19, T21, T27, T29 | ACCEPTANCE: clarity |

## A3: model

| # | Requirement (short, quoted from the brief) | Source (file + section) | Points | Task(s) | Checked in |
| --- | --- | --- | --- | --- | --- |
| 80 | "מספר הנקודות חייב להיות בדיוק 478" | A3 · המודל | — | T23 | T23 check |
| 81 | "שולחים נקודות גולמיות של MediaPipe, בלי עיבוד נוסף" | A3 · המודל | — | T23 | T23 check |
| 82 | "השתמשו ב-MediaPipe ולא בספרייה אחרת" | A3 · המודל | — | T23 | T23 check |
| 83 | "המודל אומן על 100 פריימים בקצב של 10 לשנייה"; קלט `[1, 100, 478, 3]`, פלט ראשון הוא הציון | A3 · המודל | — | T23, T24 | T23 check; T24 check |
| 84 | "את קובץ ה-ONNX מגישים כקובץ סטטי של הלקוח, וטוענים אותו פעם אחת" | A3 · הרצת המודל בדפדפן | — | T00, T23 | T00 check; T23 check |
| 85 | "הסבירו בהגנה על הפרויקט איזה מודל בחרתם, מה הוא מפספס, ואיך המערכת שלכם מתמודדת עם זה" | A3 · המודל | — | T29, T40 | T40 check (add this question to the mock defense) |
| 86 | "הווידאו לא עוזב את הדפדפן, והמצלמה נדלקת רק אחרי הסכמה" | A3 · המודל | — | T23, T25 | T25 check; T29 check |

## A3: Docker and `.env`

| # | Requirement (short, quoted from the brief) | Source (file + section) | Points | Task(s) | Checked in |
| --- | --- | --- | --- | --- | --- |
| 87 | "קובץ docker-compose.yml אחד מפעיל את כל המערכת בפקודה docker compose up, בלי שלבים ידניים" | A3 · Docker ו-docker-compose | — | T28 | T28 check |
| 88 | "הלקוח זמין ב-http://localhost:3000, והשרת ב-http://localhost:8000" | A3 · Docker ו-docker-compose | — | T05, T20, T28 | T28 check |
| 89 | "עם volume כדי שהנתונים יישמרו בין הרצות" | A3 · Docker ו-docker-compose | — | T05, T28 | T05 check; T28 check |
| 90 | "השרת מתחבר אליו בשם השירות ב-Compose ... ולא ב-localhost" | A3 · Docker ו-docker-compose | — | T05, T28 | T05 check |
| 91 | "ה-Compose מושך תמונות (image:) ציבוריות" | A3 · Docker ו-docker-compose | — | T06, T07, T28 | T06 check; T28 check |
| 92 | "התמונות חייבות להיות בנויות ל-linux/amd64" | A3 · Docker ו-docker-compose | — | T07, T28, T37 | T07 check; T37 check |
| 93 | "קבצי המודל נמצאים בתוך התמונה ולא יורדים בזמן ההרצה" | A3 · Docker ו-docker-compose | — | T00, T20, T23 | T23 check |
| 94 | "מגישים גם קובץ .env עם הערכים המקומיים של המערכת (כתובת המסד, ומפתח Gemini ריק)" | A3 · קובץ .env | — | T28 | T28 check |
| 95 | "את המפתח משאירים ריק בהגשה, והאתר חייב לעבוד גם בלעדיו (מה שלא זמין נכשל בצורה מנומסת)" | A3 · קובץ .env | — | T28, T35 | T28 check; T35 check |
| 96 | "אין בקובץ סודות אמיתיים" | A3 · קובץ .env | — | T28 | T28 check |
| 97 | "אל תעלו ל-GitHub סוד אמיתי, ואם זה קרה, החליפו אותו מיד" | A3 · קובץ .env | — | T01, T07, T28 | R4 on every PR |

## A3: `PROJECT_INFO.docx`

| # | Requirement (short, quoted from the brief) | Source (file + section) | Points | Task(s) | Checked in |
| --- | --- | --- | --- | --- | --- |
| 98 | "מלאו כל שדה. מה שלא רלוונטי, כתבו none, ומה שעובד חלקית כתבו במפורש" | A3 · קובץ המידע על הפרויקט | — | T29, T37 | T29 check |
| 99 | "אל תכתבו בקובץ סיסמאות, מפתחות או כתובות התחברות" | A3 · קובץ המידע על הפרויקט | — | T29 | T29 check |
| 100 | "אל תשנו שמות של שדות ואל תמחקו שורות" | A3 · קובץ המידע על הפרויקט; PI · הוראות | — | T29, T37 | T29 check |
| 101 | "מסמך Word קצר בעברית, עם טבלה לכל נושא"; התשובה בעמודה האחרונה. **Template missing; see open question 1** | A3 · קובץ המידע על הפרויקט; PI · הוראות | — | T00, T29 | T29 check |
| 102 | "אם הקובץ סותר את מה שמוצג באתר, מה שמוצג באתר קובע" | A3 · קובץ המידע על הפרויקט | — | T29, T37 | T29 check (button names match the UI) |
| 103 | פרטים כלליים ותוכן: `project_name`, `authors` ("אימייל grunitech של כל מגיש, מופרדים בפסיק, בלי רווחים"), `one_sentence_description`, `main_content_type`, `what_is_a_content_item`, `sample_content_type`, `sample_content_for_testing`, `interface_language` | PI · פרטים כלליים; תוכן | — | T29, T37 | T29 check |
| 104 | טכנולוגיה, שימוש והרצה: `backend_framework`, `frontend_framework`, `database`, `what_is_measured`, `models_used`, `model_highlights`, `changes_to_recommended_api`, `how_to_register`, `what_is_a_session`, `how_to_start_a_session`, `camera_notes`, `where_the_score_appears`, `seconds_until_first_score`, `low_focus_reaction`, `how_to_end_a_session`, `run_command`, `setup_notes` | PI · טכנולוגיה; שימוש באתר; הרצה | — | T29, T37 | T29 check |
| 105 | אבטחה, מצב ופרויקט: `password_storage`, `password_rules`, `token_handling`, `access_control`, `data_isolation`, `input_validation`, `camera_and_face_data`, `secrets_handling`, `extra_account_security`, `works_fully`, `partially_works_or_missing`, `known_issues`, `plugin`, `extra_features`, `what_makes_it_yours` | PI · אבטחה; מצב הפרויקט; הפרויקט שלכם | — | T29, T37 | T29 check |

## A3: submission rules

| # | Requirement (short, quoted from the brief) | Source (file + section) | Points | Task(s) | Checked in |
| --- | --- | --- | --- | --- | --- |
| 106 | שם הקובץ: "קובץ zip אחד בשם assignment3.zip" | A3 · מה מגישים | — | T28, T37, T38 | T37 check; T38 check |
| 107 | מועד: "את החלקים ולוח הזמנים נסביר בכיתה". **No date in the brief; see open question 2** | A3 · מטרת המטלה | — | T38 | T38 checklist |
| 108 | מבנה ה-zip: "עם שלושת הקבצים ברמה העליונה (לא בתוך תיקייה)": `docker-compose.yml`, `.env`, `PROJECT_INFO.docx` | A3 · מה מגישים | — | T28, T37 | T28 check; T37 check |
| 109 | "הקפידו על השמות בדיוק כפי שהם כאן, כולל אותיות קטנות"; "אין צורך בקוד המקור" | A3 · מה מגישים | — | T28, T37 | T37 check |
| 110 | "דיאגרמות UML של הפרויקט המקורי, כדוגמה לדיאגרמות שתכינו בעצמכם". Not in the mandatory row, the zip or the grading table, so ask the staff whether it is required | A3 · קבצים מצורפים | — | MISSING | — |

## A3: optional bonuses

Bonuses count only if the base works. The table adds up to 41 points, but only 20 can be earned from it, plus 30 from the plugin. Bonuses that T37 does not include in `v1` are not graded.

| # | Requirement (short, quoted from the brief) | Source (file + section) | Points | Task(s) | Checked in |
| --- | --- | --- | --- | --- | --- |
| 111 | "אפשר לצבור עד 20 נקודות מהטבלה, ועוד 30 מתוסף הדפדפן"; "ציון מעל 100 מעוגל ל-100" | A3 · בונוס: תוספות רשות | Cap 20 + 30 | T29, T37 | T37 check (`extra_features`) |
| 112 | "תוספות רשות מזכות בנקודות רק אם הבסיס עובד" | A3 · בונוס: תוספות רשות | — | T29, T36, T37 | ACCEPTANCE: all base rows |
| 113 | "פרופיל: עדכון שם תצוגה והחלפת סיסמה" | A3 · בונוס: תוספות רשות | Up to 3 | T15, T22 | T15 check; T22 check |
| 114 | מסך פרופיל: "הפרטים הנוכחיים, טפסים ברורים, ואישור מפורש לפני מחיקת החשבון" | A3 · הלקוח (טבלת המסכים) | — | T22 | T22 check |
| 115 | "מחיקת חשבון עם אישור, שמוחקת גם את כל הנתונים של המשתמש" | A3 · בונוס: תוספות רשות | Up to 3 | T15, T22 | T15 check; T22 check |
| 116 | "אבטחה מוסברת: סעיף האבטחה ב-PROJECT_INFO.docx מלא וקונקרטי, וההגנות שמתוארות בו נכונות" | A3 · בונוס: תוספות רשות | Up to 5 | T10, T11, T12, T29 | T29 check (security answers match the code) |
| 117 | "הסבר קונקרטי, עם שמות של אלגוריתמים, ספריות וערכים" | A3 · ניקוד אבטחה; PI · אבטחה | — | T29 | T29 check |
| 118 | "הגנה נוספת על החשבון: כללי סיסמה חזקה, הגבלת ניסיונות התחברות, סוד חתימה לטוקנים (JWT_SECRET)" | A3 · בונוס: תוספות רשות | Up to 4 | T04, T10, T11, T29 | T04 check; T10 check; T11 check |
| 119 | "תמיכה בכמה סוגי תוכן (למשל סרטון, טקסט ודף אינטרנט) עם תצוגה מתאימה לכל סוג" | A3 · בונוס: תוספות רשות | Up to 3 | T13, T19, T26, T27, T31 | T13 check; T26 check; T31 check |
| 120 | "האתר נוח לשימוש גם במסך טלפון" | A3 · בונוס: תוספות רשות | Up to 3 | T34 | T34 check |
| 121 | "דף אנליטיקה: קשב לאורך זמן ובין סשנים, או שימוש במשקלי Attention (v4_2 ומעלה)" | A3 · בונוס: תוספות רשות | Up to 4 | T33 | T33 check |
| 122 | "אישור הרשמה באימייל (הגדרות הדואר נשארות ריקות בהגשה, והאתר עובד גם בלעדיהן)" | A3 · בונוס: תוספות רשות | Up to 4 | MISSING | — |
| 123 | "עבודה מקורית עם המודל, בכל דרך: ... החלקת הציון, סף חכם להתערבות, שימוש בסיווג ל-5 רמות או במשקלי Attention" | A3 · בונוס: תוספות רשות | Up to 4 | T32 | T32 check |
| 124 | "תכונה שנעזרת ב-Gemini (שאלות, סיכום או משוב) שמתנהגת יפה גם בלי מפתח" | A3 · בונוס: תוספות רשות | Up to 4 | T35 | T35 check |
| 125 | "שירות חיצוני שדורש מפתח יכול להיות רק Gemini, ורק אם בחרתם בו" | A3 · קובץ .env | — | T35 | T35 check |
| 126 | "מי שבנה תוסף לדפדפן (בונוס) מוסיף תיקייה בשם extension עם קבצי התוסף" (packaging only) | A3 · מה מגישים | — | T28 | T28 check |
| 127 | `plugin`: "אחרת none" (field only; no plugin is planned) | PI · הפרויקט שלכם | — | T29 | T29 check |
| 128 | "אתגר למתקדמים: הרצת המודל בשרת עם WebSocket שמזרים נקודות פנים וציונים בזמן אמת" | A3 · בונוס: תוספות רשות | Up to 4 | MISSING | — |
| 129 | "בונוס גדול: FocusFlow כ-Plugin": תוסף ל-Chrome (Manifest V3) או לאפליקציה אחרת. "חובה להתייעץ איתנו לפני שמתחילים" | A3 · בונוס גדול | 30 | MISSING | — |

## A4: mandatory requirements

| # | Requirement (short, quoted from the brief) | Source (file + section) | Points | Task(s) | Checked in |
| --- | --- | --- | --- | --- | --- |
| 130 | "הלקוח והשרת ממטלה 3 רצים בענן כקונטיינרים" | A4 · בקצרה | — | T08, T30 | T08 check; T30 check |
| 131 | "מסד נתונים בענן (אחת משלוש האפשרויות בפרק המסד)" | A4 · בקצרה; מסד הנתונים | — | T06, T08 | T06 check; T08 check |
| 132 | "לא מריצים את המסד ב-Cloud Run" | A4 · מסד הנתונים | — | T06, T08 | T08 check |
| 133 | "Load Balancer של Google לפני הקונטיינרים" | A4 · בקצרה | — | T09 | T09 check |
| 134 | "דומיין שמצביע על ה-Load Balancer, עם HTTPS תקין" | A4 · בקצרה | — | T06, T09 | T09 check |
| 135 | "האתר עובד מקצה לקצה כמו במטלה 3, כולל מצלמה, ונשאר זמין בחלון הבדיקה" | A4 · בקצרה | — | T27, T30, T39 | T27 check, step 14; T39 check |
| 136 | "כל סיסמה, כתובת מסד או מפתח נשמרים ב-Secret Manager, ולא בקוד, בתמונה או בקובץ" | A4 · בקצרה; סודות | — | T07, T08 | T07 check; T08 check |
| 137 | "ולא כמשתנה סביבה רגיל שמוקלד ב-Console" | A4 · סודות | — | T08 | T08 check |
| 138 | "ל-Service Account של השירות צריך לתת את התפקיד Secret Manager Secret Accessor" | A4 · סודות | — | T07 | T07 check |
| 139 | בקשות ל-`/api/*` ול-`/health` "הולכות לשרת, וכל השאר ללקוח" | A4 · איך המערכת בנויה | — | T09 | T09 check |
| 140 | כתובת השרת: "היא צריכה להיות הנתיב /api באותו דומיין, ולא localhost:8000" | A4 · איך המערכת בנויה | — | T08, T16, T20, T30 | T20 check; T30 check |
| 141 | שלבי ה-LB: IP סטטי גלובלי, Serverless NEG לכל שירות, Backend service לכל אחד, URL map, תעודה מנוהלת, HTTPS proxy ו-Forwarding rule על 443 | A4 · השלבים, עם Cloud Run | — | T09 | T09 check |
| 142 | "רשומה מסוג A שמצביעה על הכתובת הסטטית, ורק עליה" | A4 · השלבים; הדומיין | — | T09 | T09 check |
| 143 | "ב-No-IP החינמי צריך לאשר את ה-hostname כל 30 יום" | A4 · הדומיין | — | T06, T09, T39 | T39 checklist |
| 144 | "Cloud Run לקונטיינרים ... קונטיינר נפרד ללקוח ולשרת" (מומלץ) | A4 · בקצרה; הקונטיינרים | — | T08 | T08 check |
| 145 | "שני מופעים לפחות הם ההמלצה. ב-Cloud Run זה קורה לבד כשיש עומס" | A4 · הקונטיינרים | — | T08, T30 | T08 check; T30 check |
| 146 | "אם השרת שומר משהו בזיכרון ... שני מופעים יראו נתונים שונים" (no in-memory state) | A4 · הקונטיינרים | — | T10, T11, T12, T14 | T11 check (attempts stored in Mongo); ACCEPTANCE: data persists |
| 147 | "אל תשדרגו" (Free Trial, קרדיט של 300 דולר) | A4 · כסף וחלון הבדיקה | — | T06 | T06 check |
| 148 | "הגדירו Budget עם התראות" | A4 · כסף וחלון הבדיקה | — | T06 | T06 check |
| 149 | "האתר צריך לעבוד לאורך כל החלון" | A4 · כסף וחלון הבדיקה | — | T39 | T39 check |
| 150 | "אחרי הבדיקה אפשר לכבות, אבל זכרו שתצטרכו אותו שוב בפרויקט הסופי" | A4 · כסף וחלון הבדיקה | — | T41 | T41 check |
| 151 | "על כל בחירה ... צריך להיות מסוגלים להסביר אותה ולנמק אותה: Cloud Run או VM, איזה מסד נתונים, כמה מופעים, ואיך שמרתם על הסודות" | A4 · ובסוף | — | T30, T40 | T40 check |
| 152 | "קבוצות שהלקוח שלהן הוא תוסף": דף התקנה, `host_permissions` לדומיין, והגשת תיקיית `extension` (applies only if the plugin replaces the client; see #129) | A4 · קבוצות שהלקוח שלהן הוא תוסף | — | MISSING | — |

## A4: grading table

| # | Requirement (short, quoted from the brief) | Source (file + section) | Points | Task(s) | Checked in |
| --- | --- | --- | --- | --- | --- |
| 153 | דומיין ו-HTTPS: "הדומיין נפתח, עם https:// ותעודה תקינה (בלי אזהרת אבטחה)" | A4 · מה נבדק | Not stated | T09, T30 | ACCEPTANCE: domain + HTTPS |
| 154 | השרת: "https://YOUR-DOMAIN/health מחזיר 200" | A4 · מה נבדק | Not stated | T08, T09, T30 | ACCEPTANCE: /health |
| 155 | האתר: "הרשמה, התחברות, הוספת תוכן וסשן עם מצלמה עובדים כמו במטלה 3" | A4 · מה נבדק | Not stated | T27, T30 | ACCEPTANCE: full flow |
| 156 | נתונים נשמרים: "אחרי רענון, התנתקות והתחברות מחדש, התוכן וההיסטוריה עדיין שם" | A4 · מה נבדק | Not stated | T06, T08, T30 | ACCEPTANCE: data persists |
| 157 | זמינות: "האתר עובד לאורך כל חלון הבדיקה" | A4 · מה נבדק | Not stated | T30, T39 | ACCEPTANCE: availability; T39 check |

## A4: submission rules

| # | Requirement (short, quoted from the brief) | Source (file + section) | Points | Task(s) | Checked in |
| --- | --- | --- | --- | --- | --- |
| 158 | פורמט: "יש להגיש קובץ מסוג JSON בלבד" | A4 · איך מגישים | — | T30, T38 | T30 check |
| 159 | שם הקובץ: "מזהה הפרויקט שלכם באנגלית, ללא רווחים" (לדוגמה `focus-ninjas.json`) | A4 · איך מגישים | — | T06, T30, T38 | T30 check |
| 160 | `project`: "מזהה הקבוצה, התואם בדיוק לשם הקובץ" | A4 · מבנה הקובץ | — | T30 | T30 check |
| 161 | `domain`: "כתובת האתר הפעיל, כולל פרוטוקול https://" | A4 · מבנה הקובץ | — | T30 | T30 check |
| 162 | `members`: "שמותיהם המלאים של כלל השותפים בצוות" | A4 · מבנה הקובץ | — | T30 | T30 check |
| 163 | "מספיקה הגשה של נציג אחד מהצוות" | A4 · מבנה הקובץ | — | T38 | T38 checklist |
| 164 | "המטלה נעשית באותן קבוצות של מטלה 3" | A4 · מטרת המטלה | — | T30, T38 | T30 check (`members`) |
| 165 | מועד: "תאריך ההגשה זהה" למטלה 3. **No date in the brief; see open question 2** | A4 · מטרת המטלה | — | T38 | T38 checklist |
| 166 | "חלון הבדיקה: [תאריכים ימולאו בהמשך]". **Not filled in; see open question 2** | A4 · כסף וחלון הבדיקה | — | T39, T41 | T39 check |
| 167 | "נקודות הבונוס האלה עוברות למטלה הזו ... גם כאן הציון לא עובר את 100" (no separate A4 bonuses) | A4 · בונוס: מה עובר ממטלה 3 | Carried over | T31, T32, T33, T34, T35, T37 | T37 check |

## Integrity rules (both assignments)

| # | Requirement (short, quoted from the brief) | Source (file + section) | Points | Task(s) | Checked in |
| --- | --- | --- | --- | --- | --- |
| 168 | "עליכם להבין ולהיות מסוגלים להסביר כל חלק בפרויקט שהגשתם" | A3 · כללי יושרה; A4 · כללי יושרה | — | T40 | T40 check |
| 169 | "אסור להעתיק פרויקט של סטודנט אחר" | A3 · כללי יושרה | — | T40 | T40 check (each member explains the code) |
| 170 | "מפתח או סיסמה אמיתיים ... שהועלו ל-GitHub או נכללו בקובץ שהוגש הם עבירה חמורה ויובילו להורדת ציון" | A3 · כללי יושרה | — | T01, T07, T28, T37 | R4 on every PR; T29 check |
| 171 | "סודות רק ב-Secret Manager ... מפתח שדלף מחליפים מיד" | A4 · כללי יושרה | — | T07, T08 | T08 check; R4 on every PR |

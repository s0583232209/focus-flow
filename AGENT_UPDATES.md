# עדכונים מהסוכן: מה נעשה, מה הוחלט ומה פתוח

הקובץ לא בקומיט בכוונה, כדי שלא ייכנס לאף PR. אפשר למחוק אותו כשתסיימו.

## המצב בקצרה

- בוצעו T05, T07–T28 ו-T29 (חוץ מהחלקים הידניים שלהן), ועוד תיקון אחד תחת T36: 26 קומיטים ב-25 ענפים.
- **הכול מקומי.** שום דבר לא נדחף לגיטהאב, ולא מוזג ל-`main`.
- הענף הנוכחי הוא `docs/T29-acceptance-and-info`, והוא כולל את כל השאר.
- השינויים שלך ב-`TASKS.md` (סימוני ה-V) נשארו לא מקומטים, בדיוק כמו שהיו.

## הכי חשוב לבדוק ראשון

**הציונים של המודל לא אומתו על אדם אמיתי.** זו שורה ששווה 26 נקודות.

בדקתי עם תמונת סטילס של פנים (תמונת הדוגמה של MediaPipe) שהוזנה כמצלמה מזויפת. הציון יצא כמעט קבוע, בערך 0.17. הקלט תואם להנחיות (478 נקודות גולמיות, 100 פריימים, 10 לשנייה), ותמונה סטטית לא מלמדת הרבה, אז זה לא בהכרח באג. אבל גם לא הוכחתי שזה תקין.

מה לעשות:
1. מריצים OBS עם סרטון של אדם ממוקד (שלב ה-OBS ב-T24). מצופה ציון מעל 0.6 רוב הזמן.
2. אם הציון נמוך, ההנחיות (פרק המודל) מציינות שבאימון נחתך אזור הפנים לפני חילוץ הנקודות, וממליצות לנסות חיתוך. אפשרות נוספת היא לנסות את `v1.onnx`.

## למה נעצרתי

| מה תקוע | מה צריך ממך |
| --- | --- |
| בונוסים T31–T35 | לפי `TASKS.md` מתחילים רק אחרי ש-T29 ו-T36 ירוקים, וזה דורש בדיקת קבלה אנושית עם OBS |
| T37, T30, T38–T41 | תלויים בבדיקת הקבלה ובחשבונות הענן |
| T06 וריצה אמיתית של T07–T09 | חשבונות GCP, Atlas, No-IP ו-Docker Hub. `gcloud` לא מותקן במחשב הזה |
| קובץ `PROJECT_INFO.docx` | התבנית המקורית לא בריפו, יש רק PDF. בלעדיה אי אפשר לבנות את ה-zip הסופי |
| שדות `TODO` ב-`docs/PROJECT_INFO_draft.md` (9 מקומות) | מיילים של המגישים, קישור דוגמה, מצב סופי, ומה הופך את הפרויקט לשלכם |
| מועדי הגשה | לא מופיעים בהנחיות, צריך לברר מול צוות הקורס |

## מה נבדק ואיך

| רמה | משימות | איך |
| --- | --- | --- |
| נבדק בריצה | T05, T10–T15 | 107 טסטים של pytest, ובנוסף פקודות ה-API מ-`TASKS.md` מול הסטאק ב-Docker |
| נבדק בריצה | T16–T22, T23–T27 | דפדפן Edge אוטומטי מול הסטאק ב-Docker עם מצלמה מזויפת: הרשמה, התחברות, ספרייה, סשן, ציון, אין פנים, סיום, היסטוריה, הפרדה בין משתמשים, פרופיל, מחיקת חשבון, סירוב למצלמה, 409, נפילת שרת, סגירת לשונית |
| נבדק חלקית | T28 | הזרימה רצה מתיקייה ריקה עם שני קבצים, אבל מתמונות מקומיות שתויגו בשם משתמש מדומה, לא מ-Docker Hub. ה-zip נבנה עם קובץ זמני במקום ה-docx האמיתי |
| נבדק סטטית בלבד | T07, T08, T09 | `shellcheck` ו-`bash -n`. **אף פקודת `gcloud` לא רצה**, ולכן גם הדגלים לא אומתו |
| לא נבדק | OBS, טלפון, ענן, בדיקה ידנית של נגישות במקלדת | דורש אדם או חשבון ענן |

## החלטות שלקחתי לבד (קונפליקטים וסטיות מ-TASKS.md)

1. **ענפים מדורגים.** מיזוג ל-`main` שמור לאדם, אז כל ענף יוצא מקודמו. ראו "איך מעלים לגיטהאב" למטה.
2. **Motor הוחלף ב-`AsyncMongoClient`.** הקוד שמוזג ב-T04 השתמש ב-Motor, אבל `CLAUDE.md` דורש PyMongo async. הגרסה עלתה ל-`pymongo 4.13.2`. נעשה בקומיט הראשון של T10.
3. **`errors.py` תוקן (בתוך T13).** כל 404 הפך ל-"Not found" ומחק הודעות כמו "Content not found".
4. **`Referrer-Policy` שונה מ-`no-referrer` ל-`strict-origin-when-cross-origin`.** הנוסח ב-T20 עלול לשבור את נגן YouTube (Error 153). הסיבה מבוססת על ידע קודם שלי, ולא יכולתי לאמת אותה כאן כי NetFree חוסם את הנגן.
5. **`onnxruntime-web/wasm` במקום `onnxruntime-web`, וקובץ WASM אחד במקום כולם.** T23 ביקש להעתיק את כל הקבצים. זה חוסך כ-90MB בתמונה, והמודל נבדק ורץ.
6. **שם המשתמש ב-Docker Hub נקרא מ-`.env`** (`DOCKER_USER`), לא כתוב בקובץ. T28 ביקש לשאול אותך ולכתוב שם קבוע. `make-submission.sh` דורש אותו, ו-`docker compose up` אצל הבודק קורא אותו מה-`.env` המוגש.
7. **`ScoreLevel.js` נוצר ב-T25 ולא ב-T21,** כי T25 כבר צריך אותו.
8. **הודעות שרת תורגמו לעברית בלקוח** (`src/api/messages.js`). השרת נשאר באנגלית כמו שדרוש ב-`TASKS.md`, אבל הממשק כולו בעברית. הודעות חוזק סיסמה נכתבו ישירות בעברית בשרת.
9. **שם מייל קצר.** הכלל "הסיסמה לא תכלול את שם המייל" חל רק משלושה תווים ומעלה, אחרת `a@x.com` היה פוסל כמעט כל סיסמה.
10. **אם השרת לא זמין בטעינה, המשתמש נשאר בדף** ורואה "נסו שוב", במקום לעבור ל-`/login`. T19 דורש את זה.
11. **`security-headers.conf` נפרד.** ב-nginx, `add_header` בתוך location מבטל את הכותרות שבירש, אז כל location כולל את אותו קובץ.
12. **נוסף `.gitattributes`.** אצלך `autocrlf` פעיל, ו-`.sh` עם CRLF היה נשבר בקונטיינר.
13. **נוסף `MONGO_HOST_PORT` ב-`docker-compose.dev.yml`,** כי פורט 27017 תפוס אצלך על ידי `escape-room-mongo-1` (לא נגעתי בו).
14. **טסטים משתמשים ב-`pw=` ולא `password=`,** אחרת הם מכשילים את בדיקת הסודות R4.

## דברים שכדאי לדעת

- **NetFree חוסם את הרשת בשני מקומות:**
  - בניית תמונות נכשלת עם `CERTIFICATE_VERIFY_FAILED`. הפתרון: `scripts/local-ca-base-images.sh`, והוראות ב-`scripts/README.md`. תמונה שנבנית כך נושאת את ה-CA הציבורי של NetFree, אז עדיף לבנות את `v1` הסופי מרשת אחרת.
  - נגן YouTube חסום (418), וגם התמונות הממוזערות לא הופיעו. **לכן ניגון וידאו אמיתי לא נבדק.** צריך לבדוק מרשת אחרת, או לבקש פתיחה ב-NetFree.
- **טלמטריה של MediaPipe:** הספרייה מנסה לשלוח נתוני שימוש ל-`odml.pa.googleapis.com`. ה-CSP של nginx חוסם את זה (ראיתי את החסימה בקונסול), אבל ב-`npm run dev` אין CSP והבקשה יוצאת. זה לא וידאו ולא נקודות פנים לפי מה שקראתי בקוד, אבל לא פענחתי את תוכן ההודעה.
- **זמן עד ציון ראשון:** בדיקה ב-Lab: כ-10 שניות מרגע שהמודל נטען. ב-Watch בטעינה ראשונה על דפדפן ללא GPU: כ-24 שניות בסך הכול. במחשב רגיל זה כנראה מהיר יותר, כדאי למדוד לפני שממלאים את השדה.
- **R1 ב-`TASKS.md` מבקש 2–6 קומיטים למשימה.** רוב המשימות כאן הן קומיט אחד, אז הבודק יראה חריגה.
- **R4 יציג שלוש שורות, וכולן תקינות:** `jwt-secret:latest` (שם סוד), `$jwt_secret` (משתנה בסקריפט) ו-`change-me-...` (placeholder).
- **`/health` כשאין מסד בעלייה:** אם Mongo לא זמין כשהשרת עולה, השרת לא עולה בכלל במקום להחזיר 503. זו ההתנהגות שמוזגה ב-T04, ולא שיניתי אותה. ב-Cloud Run זה ייראה ככישלון פריסה, אז בודקים את Network Access של Atlas ואת הסוד.
- **ה-`.env` המקומי שלך לא שונה.** כדי להריץ `npm run dev` מול השרת צריך להוסיף `http://localhost:5173` ל-`CORS_ORIGINS`.
- **קובץ עזוב ב-`main`:** `Sarah Fink - env.example` עוקב ב-git. הוא נראה כמו תבנית מהקורס, ולא נגעתי בו. כדאי להחליט אם הוא צריך להישאר.
- **מה נשאר מקומית:** תמונות הבסיס `ff-local/*` ותמונות `focusflow-*`. נתוני הבדיקה שלי נמחקו (`down -v`).

## איך מעלים לגיטהאב

`gh` לא מותקן, אז פותחים את ה-PR-ים דרך האתר. סדר הענפים (כל אחד יוצא מקודמו):

```
infra/T05-backend-docker
feat/T10-user-model-security
feat/T11-register-login
feat/T12-auth-dependency
feat/T13-content-api
feat/T14-sessions-api
feat/T15-profile-api
feat/T16-frontend-scaffold
feat/T17-api-client-auth
feat/T18-auth-pages
feat/T19-library-page
infra/T20-frontend-docker
feat/T23-face-and-model
feat/T24-attention-loop
feat/T25-camera-ui
feat/T26-content-viewers
feat/T27-watch-page
feat/T21-history-pages
feat/T22-profile-page
fix/T36-youtube-player
infra/T07-build-and-secrets
infra/T08-cloud-run-deploy
infra/T09-load-balancer
infra/T28-submission
docs/T29-acceptance-and-info
```

דחיפה של כולם, בלי לשנות שום דבר אחר:

```bash
git push -u origin infra/T05-backend-docker feat/T10-user-model-security feat/T11-register-login feat/T12-auth-dependency feat/T13-content-api feat/T14-sessions-api feat/T15-profile-api feat/T16-frontend-scaffold feat/T17-api-client-auth feat/T18-auth-pages feat/T19-library-page infra/T20-frontend-docker feat/T23-face-and-model feat/T24-attention-loop feat/T25-camera-ui feat/T26-content-viewers feat/T27-watch-page feat/T21-history-pages feat/T22-profile-page fix/T36-youtube-player infra/T07-build-and-secrets infra/T08-cloud-run-deploy infra/T09-load-balancer infra/T28-submission docs/T29-acceptance-and-info
```

ב-PR של כל ענף בוחרים כ-base את הענף הקודם ברשימה, כך שה-diff מראה רק את המשימה. **שימו לב:** ה-Squash and merge מ-`GIT_WORKFLOW.md` יוצר קומיט חדש, ואז הענף הבא צריך rebase לפני המיזוג שלו:

```bash
git fetch origin
git rebase --onto origin/main <הענף הקודם> <הענף הבא>
```

זה משכתב את הענף הבא, ולכן הדחיפה שלו דורשת `--force-with-lease`. לפי `GIT_WORKFLOW.md` זה דורש החלטה אנושית.

## מה הלאה, לפי הסדר

1. בדיקת OBS עם אדם ממוקד (הסעיף הראשון בקובץ הזה).
2. בדיקת נגן YouTube מרשת בלי NetFree.
3. עוברים על ה-PR-ים, ודוחפים לפי הפקודה למעלה.
4. משיגים את תבנית ה-docx ומשלימים את ה-`TODO`.
5. בדיקת קבלה מלאה לפי `docs/ACCEPTANCE.md`. כל כישלון הופך ל-Issue ול-T36.
6. T06, ואז הרצה אמיתית של `setup-secrets.sh`, `deploy.sh` ו-`setup-lb.sh`.
7. בונוסים אם נשאר זמן, ואז T37.

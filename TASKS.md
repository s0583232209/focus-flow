# TASKS.md — משימות ממוספרות לחלוקה בצוות (FocusFlow, מטלות 3+4)

## איך עובדים עם הקובץ – מילה מראש הצוות

כל משימה כאן היא **ענף אחד ו-Pull Request אחד** לפי `GIT_WORKFLOW.md`. כל משימה כוללת:

- **אחראי ותלויות** – מי עושה אותה, ומה צריך להיות ממוזג ל-`main` לפני שמתחילים.
- **ענף** – השם המדויק לענף.
- **הסבר מראש הצוות** – מה בונים, למה זה חשוב לציון, ואיפה נופלים בדרך כלל.
- **הגדרת "סיום"** – איך בודקים שהמשימה באמת עובדת. בלי זה לא פותחים PR.
- **איך בודקים** – הצעדים המדויקים (פקודות + תוצאה צפויה) שהבודק של ה-PR מריץ כדי לאשר שהמשימה בוצעה נכון.
- **פרומפט** – מדביקים כמו שהוא ב-Cursor (מצב Agent) או ב-Claude Code.

הקובץ מכסה את **כל** הפרויקט – מחומרי המטלה ועד הפירוק בענן אחרי הציון. כשכל משימות החובה גמורות לפי "איך בודקים" שלהן, הפרויקט גמור. ראו "הפרויקט גמור כאשר" בסוף הקובץ – שם גם רשימת המעקב.

### תפקידים

| תפקיד | מי | תחום |
| --- | --- | --- |
| **A** | מפתח שרת וענן | FastAPI, MongoDB, אבטחה, Docker, GCP |
| **B** | מפתח לקוח | React, מסכים, ניווט, חוויית משתמש |
| **C** | מפתח מודל ומצלמה | MediaPipe, ONNX, מסך הצפייה |

בזוג: A נשאר כמו שהוא, ו-B לוקח גם את משימות C.

### איך משתמשים בפרומפטים בכל כלי

אותו פרומפט עובד בשני הכלים, כי כללי הפרויקט (`CLAUDE.md`, `.cursor/rules/`, `GIT_WORKFLOW.md`) נטענים אוטומטית בשניהם. ההבדלים:

| | Cursor | Claude Code |
| --- | --- | --- |
| איפה מדביקים | צ'אט במצב **Agent** | בטרמינל, בתוך תיקיית הריפו (`claude`) |
| הקשר לקבצים | אפשר לצרף `@backend/app/main.py` וכו' | קורא קבצים לבד; אפשר לציין נתיבים בפרומפט |
| הרצת פקודות | מאשרים כל פקודה שהוא מציע | מאשרים פקודות לפי הגדרות ההרשאות |
| מומלץ במיוחד ל- | מסכים ו-UI (רואים מיד את התוצאה) | משימות שרת, טסטים, סקריפטים וגיט |

### תבנית פתיחה וסגירה (כבר בתוך כל פרומפט למטה)

כל פרומפט מתחיל ב:

```
Task T<NN>: <title>. Follow GIT_WORKFLOW.md: create branch <branch> from an up-to-date main before changing anything.
```

ונגמר ב:

```
When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T<NN>"), push the branch and open a PR. Do not merge.
```

### איך בודקים שמשימה בוצעה נכון

לכל משימה יש **הגדרת סיום** (מה צריך להיות נכון) ו-**איך בודקים** (הצעדים המדויקים והתוצאה הצפויה). את "איך בודקים" מריץ **מי שעושה review ל-PR, לא מי שכתב את הקוד**, על הענף של ה-PR ולפני האישור. משימה גמורה רק כשכל הצעדים עברו, כל תיבות "הגדרת סיום" מסומנות, וה-PR מוזג ל-`main`. אם צעד נכשל, כותבים בתגובה ל-PR מה ראיתם, והכותב מתקן באותו ענף.

**בדיקות שחוזרות בכל PR (R1–R6)** – במשימות קוד מריצים אותן תמיד, בנוסף לבדיקות של המשימה:

| # | מה בודקים | איך | תוצאה צפויה |
| --- | --- | --- | --- |
| R1 | ענף ו-commits | `git fetch origin && git checkout <branch> && git log --oneline origin/main..HEAD` | שם הענף כמו במשימה; 2–6 commits בפורמט `type(scope): summary` |
| R2 | כל commit עם בדיקה ומזהה | `git log origin/main..HEAD --format=%B \| grep -c "How to test"` ושוב עם `"Task: T<NN>"` | שני המספרים שווים למספר ה-commits |
| R3 | רק קבצים של המשימה | `git diff --stat origin/main...HEAD` | אין קבצים של משימות אחרות בלי הסבר ב-PR |
| R4 | אין סודות | שתי הפקודות מתחת לטבלה | אין פלט, או רק placeholder/שם סוד (`change-me-...`, `jwt-secret:latest`) |
| R5 | בדיקות אוטומטיות | שרת: "הרצת טסטים לשרת" למטה · לקוח: `cd frontend && npm ci && npm run build` · Docker: `docker compose -f docker-compose.dev.yml up --build -d && curl -s localhost:8000/health` | הכל ירוק; `{"status":"ok"}` |
| R6 | אחרי המיזוג | `git checkout main && git pull --rebase`, ואז R5 שוב | `main` עדיין עובד |

```bash
# R4 – secrets in added lines, and forbidden files
git diff origin/main...HEAD | grep '^+' | grep -nE "mongodb\+srv://.*:.*@|JWT_SECRET=.{8,}|AIza|-----BEGIN|\"private_key\"|password\s*=\s*['\"][^'\"]+"
git diff --name-only origin/main...HEAD | grep -E '(^|/)\.env$|node_modules/|\.venv/|dist/|service-account|gcp-key'
```

**הרצת טסטים לשרת** (מ-T04 והלאה; ב-Windows מריצים ב-Git Bash, ואם `python` לא קיים משתמשים ב-`py`):

```bash
# once per machine
cd backend
python -m venv .venv
source .venv/Scripts/activate      # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
# every run – Mongo from compose is published on 127.0.0.1:27017 (T05).
# In T04, before compose exists: docker run -d --name ff-mongo -p 127.0.0.1:27017:27017 mongo:7
docker compose -f ../docker-compose.dev.yml up -d mongodb
MONGO_URL=mongodb://localhost:27017 MONGO_DB=focusflow \
JWT_SECRET=test-secret-that-is-at-least-32-characters CORS_ORIGINS=http://localhost:3000 \
pytest -q
```
צפוי: `passed` בלי `failed`/`error`. הטסטים עובדים רק על המסד `focusflow_test`.

**כלי עזר לבדיקות API** – מדביקים פעם אחת בטרמינל (Git Bash), משורש הריפו. כל הבדיקות של השרת והלקוח משתמשות בהם:

```bash
API=http://localhost:8000          # in the cloud: API=https://<domain>
PW='Passw0rd123'
reg()  { curl -s -w '\n%{http_code}\n' -X POST "$API/api/auth/register" -H 'Content-Type: application/json' \
           -d "{\"email\":\"$1\",\"password\":\"${2:-$PW}\",\"display_name\":\"Tester\"}"; }
lg()   { curl -s -w '\n%{http_code}\n' -X POST "$API/api/auth/login" -H 'Content-Type: application/json' \
           -d "{\"email\":\"$1\",\"password\":\"${2:-$PW}\"}"; }
tok()  { lg "$1" "$2" | head -1 | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])"; }
call() { if [ -n "$4" ]; then curl -s -w '\n%{http_code}\n' -X "$1" "$API$2" -H "Authorization: Bearer $3" -H 'Content-Type: application/json' -d "$4";
         else curl -s -w '\n%{http_code}\n' -X "$1" "$API$2" -H "Authorization: Bearer $3"; fi; }
jid()  { head -1 | python -c "import sys,json;print(json.load(sys.stdin)['id'])"; }
mq()   { docker compose -f docker-compose.dev.yml exec -T mongodb mongosh focusflow --quiet --eval "$1"; }
```
`reg`/`lg`/`call` מדפיסים את גוף התגובה, ובשורה האחרונה את קוד הסטטוס. דוגמה: `A=$(tok alice@test.com); call GET /api/users/me "$A"`.

### מפת תלויות (סדר מומלץ)

```
יום 1:    T01 → T00 → T02 → T03      (כולם יחד)   |  T06 (A, ידני, במקביל)
יום 2:    T04 → T05 → T07 → T08 → T09            (A)
ימים 2–4: T10 → T11 → T12 → T13 → T14 → T15     (A)
          T16 → T17 → T18 → T19 → T20            (B)
          T23 → T24 → T25 → T26                  (C)
ימים 5–6: T27 (C+B) → T21 → T22                  (B)
יום 7:    T28                                    (A)
ימים 8–9: T29 (כולם) → T36 (תיקונים) → בונוסים T31–T35 (אופציונלי, כל אחד עם בדיקת רגרסיה)
סיום:     T37 (הקפאת v1) → T30 (ענן) → T38 (הגשה) → T39 (חלון הבדיקה) → T40 (הגנה) → T41 (פירוק, אחרי הציון)
```

**חשוב:** מה שמוגש ונבדק הוא תג `v1` שנבנה ב-T37. בונוס או תיקון שלא מוזג לפני T37 לא נכנס להגשה.

---

# חלק 1: משותף – הקמה (יום 1)

## T00 – חומרי המטלה בריפו ומיפוי דרישות
- **אחראי:** A (כולם עוזרים) · **תלוי ב:** T01 · **ענף:** `chore/T00-assignment-materials`

**הסבר מראש הצוות:** כדי שנוכל לומר "סיימנו את כל המשימות, אז הפרויקט גמור", צריך להוכיח שכל דרישה במטלה מכוסה במשימה. לכן מכניסים לריפו את חומרי המטלה המקוריים (ההנחיות של מטלות 3 ו-4 ותבנית PROJECT_INFO) ואת קבצי המודל שלא נכנסו ב-T01. אחר כך בונים טבלת מעקב `docs/REQUIREMENTS.md`: כל דרישה, המשימה שמממשת אותה, והשורה שבודקת אותה. דרישה בלי משימה – מוסיפים משימה ל-TASKS.md לפני שממשיכים.

**ידני לפני הפרומפט:**
- [ ] מעתיקים את ההנחיות של מטלה 3 ושל מטלה 4 (כפי שקיבלנו, PDF/DOCX) ל-`docs/assignment/`
- [ ] מעתיקים את תבנית `PROJECT_INFO.docx` המקורית ל-`docs/assignment/PROJECT_INFO_template.docx`, בלי לשנות אותה
- [ ] מעתיקים `v4_2.onnx` (ו-`v1.onnx` לגיבוי) ל-`frontend/public/models/`, ומורידים מאתר MediaPipe את `face_landmarker.task` (Face Landmarker, float16) לאותה תיקייה

**הגדרת סיום:**
- [ ] שלושת קבצי המודל בריפו, בגודל אמיתי (לא 0 בתים)
- [ ] חומרי המטלה נמצאים ב-`docs/assignment/`
- [ ] ב-`docs/REQUIREMENTS.md` לכל דרישה יש משימה, ואין `MISSING`

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
```bash
ls -la frontend/public/models                 # v4_2.onnx, v1.onnx, face_landmarker.task – all > 0 bytes
du -h frontend/public/models/*                # each well below GitHub's 100 MB limit
git ls-files frontend/public/models docs/assignment
grep -c "MISSING" docs/REQUIREMENTS.md        # 0 (after the missing tasks were added to TASKS.md)
```
- [ ] הבודק בוחר 5 דרישות אקראיות מההנחיות ומוצא כל אחת ב-`REQUIREMENTS.md` עם המשימה הנכונה
- [ ] כל שורות טבלת הניקוד מההנחיות מופיעות, וסכום הנקודות של הבסיס הוא 100
- [ ] כללי ההגשה (שמות קבצים, מבנה ה-zip, פורמט ה-JSON, מועדים) מופיעים כשורות נפרדות
- [ ] לכל שורה שהייתה `MISSING` נוספה משימה ל-TASKS.md (PR נפרד), והשורה עודכנה

**פרומפט:**
```
Task T00: assignment materials and requirements map. Follow GIT_WORKFLOW.md: create branch chore/T00-assignment-materials from an up-to-date main before changing anything.

The files in docs/assignment/ and frontend/public/models/ were copied manually (if any is missing, stop and tell me). Commit them as they are and remove frontend/public/models/.gitkeep.
Read every file in docs/assignment/ and create docs/REQUIREMENTS.md: a table with columns "#", "Requirement (short, quoted from the brief)", "Source (file + section)", "Points", "Task(s)" (IDs from TASKS.md), "Checked in" (the ACCEPTANCE.md row or the task's verification step). Include every mandatory requirement of assignments 3 and 4, every grading-table row, every submission rule (file names, zip layout, JSON format, deadlines) and every bonus. If a requirement has no task in TASKS.md, write "MISSING" in the Task(s) column and list all MISSING rows at the top of the file. Do not invent tasks yourself.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T00"), push the branch and open a PR. Do not merge.
```

## T01 – שלד הריפו
- **אחראי:** A (כולם צופים) · **תלוי ב:** – · **ענף:** `chore/T01-repo-skeleton`

**הסבר מראש הצוות:** זה הבסיס של כל השאר. הכי חשוב כאן הוא `.gitignore` – אם `.env` נכנס פעם אחת לגיטהאב, צריך להחליף את כל הסודות. גם `.env.example` חשוב: הוא מתעד לכל אחד אילו משתנים קיימים, בלי ערכים אמיתיים. את קבצי המודל (`v4_2.onnx`, `face_landmarker.task`) מכניסים כבר עכשיו ל-`frontend/public/models/`, כדי שלא ילכו לאיבוד. (בפועל זה עבר ל-T00, יחד עם שאר חומרי המטלה.)

**הגדרת סיום:**
- [ ] `git status` אחרי יצירת `.env` מקומי לא מציג אותו
- [ ] המבנה תואם לתיקיות במסמך התכנון
- [ ] הריפו ב-GitHub פרטי, וכל חברי הצוות הוזמנו

**איך בודקים שהמשימה בוצעה נכון** (✅ מוזג ב-PR #1; קבצי המודל עברו ל-T00):
```bash
git checkout main && git pull --rebase
cp -n .env.example .env && git status --short      # .env is NOT listed
git check-ignore -v .env .env.local submission/assignment3.zip node_modules/x gcp-key.json   # every path matched
git ls-files .env.example                          # tracked
ls backend/app backend/tests frontend/public/models scripts/gcp submission docs
```
- [ ] GitHub → Settings → General: הריפו **Private**; Settings → Collaborators: כל חברי הצוות הוזמנו ואישרו
- [ ] `.env.example` מכיל רק placeholders

**פרומפט:**
```
Task T01: repo skeleton. Follow GIT_WORKFLOW.md: create branch chore/T01-repo-skeleton from an up-to-date main before changing anything.

Create the initial skeleton for "focusflow":
- backend/app/__init__.py (empty), backend/tests/__init__.py (empty)
- frontend/ with only frontend/public/models/.gitkeep (model files will be copied manually)
- scripts/ and scripts/gcp/ with .gitkeep
- submission/.gitkeep
- docs/.gitkeep
- .gitignore ignoring: .env, .env.*, !.env.example, node_modules/, dist/, __pycache__/, *.pyc, .venv/, .pytest_cache/, submission/*.zip, .DS_Store, *.log, gcp-key*.json, *service-account*.json
- .env.example with placeholders only:
  MONGO_URL=mongodb://mongodb:27017
  MONGO_DB=focusflow
  JWT_SECRET=change-me-to-a-long-random-string
  JWT_EXPIRE_MINUTES=60
  CORS_ORIGINS=http://localhost:3000
  API_URL=http://localhost:8000
  GEMINI_API_KEY=
- README.md: one paragraph about the project, how to run locally (cp .env.example .env; docker compose -f docker-compose.dev.yml up --build), and links to GIT_WORKFLOW.md and TASKS.md.
Do not create any other files. Do not add real secrets anywhere.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T01"), push the branch and open a PR. Do not merge.
```

## T02 – כללים לסוכני ה-AI
- **אחראי:** A · **תלוי ב:** T01 · **ענף:** `chore/T02-agent-rules`

**הסבר מראש הצוות:** כאן "מלמדים" את Cursor ואת Claude Code את הדרישות של המטלה פעם אחת, במקום לחזור עליהן בכל פרומפט. משימה של 15 דקות שחוסכת עשרות טעויות: 404 במקום 403, שגיאות בפורמט `{"message"}`, אין סודות בקוד, אין מצב בזיכרון (חשוב לענן). שימו לב שיש כאן שני סוגי קבצים: `CLAUDE.md` ל-Claude Code ו-`.cursor/rules/*.mdc` ל-Cursor – התוכן זהה בעיקרו.

**הגדרת סיום:**
- [ ] ב-Claude Code: `/memory` מציג את `CLAUDE.md` ואת `GIT_WORKFLOW.md`
- [ ] ב-Cursor: שואלים בצ'אט חדש "מה מחזירים כשמבקשים פריט של משתמש אחר?" – התשובה 404
- [ ] שני הכלים יודעים שאסור לבצע commit ל-main

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
```bash
head -2 CLAUDE.md                                   # @GIT_WORKFLOW.md and @TASKS.md
grep -l "alwaysApply: true" .cursor/rules/*.mdc     # project.mdc and git-workflow.mdc
diff <(sed -n '/^# Project rules/,$p' CLAUDE.md) <(sed -n '/^# Project rules/,$p' .cursor/rules/project.mdc)   # no output = same rules
```
- [ ] Claude Code: `claude` בשורש הריפו → `/memory` → מופיעים CLAUDE.md, ו-GIT_WORKFLOW.md ו-TASKS.md כקבצים מיובאים
- [ ] Cursor: Settings → Rules: שני הכללים מסומנים Always
- [ ] בצ'אט חדש בכל אחד מהכלים: "מה מחזירים כשמבקשים פריט של משתמש אחר?" → 404; "אפשר לעשות commit ל-main?" → לא, ענף ו-PR; "איפה שומרים את הגבלת ניסיונות ההתחברות?" → ב-MongoDB, לא בזיכרון

**פרומפט:**
```
Task T02: AI agent rules. Follow GIT_WORKFLOW.md: create branch chore/T02-agent-rules from an up-to-date main before changing anything.

GIT_WORKFLOW.md and TASKS.md already exist in the repo root (if not, stop and tell me).
Create:
1. CLAUDE.md in the repo root. First lines: "@GIT_WORKFLOW.md" and "@TASKS.md" (imports). Then a "Project rules" section.
2. .cursor/rules/project.mdc (frontmatter: description, alwaysApply: true) with the same "Project rules".
3. .cursor/rules/git-workflow.mdc (alwaysApply: true) that says: "Always follow @GIT_WORKFLOW.md for branches, commits and PRs. Task IDs are in @TASKS.md."

"Project rules" content:
- Project: FocusFlow-style attention site. 3 containers locally: frontend (nginx, port 3000), backend (FastAPI, port 8000), mongodb. In the cloud (assignment 4) the same images run on Google Cloud Run behind one HTTPS Load Balancer: /api/* and /health go to the backend, everything else to the frontend. Database in the cloud: MongoDB Atlas.
- Backend: Python 3.12, FastAPI, PyMongo async (AsyncMongoClient), Pydantic v2, pydantic-settings, bcrypt (library, cost 12), PyJWT HS256.
- GET /health (no /api prefix) -> 200 {"status":"ok"} only if Mongo ping works, else 503.
- All other routes start with /api. Every error is JSON {"message": "..."} with 400/401/404/409/422/429.
- IDs are strings named "id". Datetimes UTC ISO 8601 with "Z".
- Passwords never returned or logged. Every user-data query filters by owner_id from the JWT, never from the body. Another user's resource -> 404.
- Backend keeps NO state in memory (no dicts for sessions, tokens, rate limits) because the cloud runs several instances. Use MongoDB.
- All config/secrets from environment variables via app/config.py. Never hardcode secrets or URLs.
- Frontend: React + Vite + React Router, JavaScript, Hebrew UI, dir="rtl". API base URL from window.__APP_CONFIG__.API_URL (may be the EMPTY string in the cloud = same-origin; use ?? not ||). All requests through src/api/client.js (Bearer token, redirect to /login on 401).
- Every button has visible text. Every action shows loading/success/error. No dangerouslySetInnerHTML.
- Camera video and face landmarks never leave the browser; only score and position are sent.
- Keep changes small and focused on the current task; do not touch files of other tasks without saying so.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T02"), push the branch and open a PR. Do not merge.
```

## T03 – הגדרות GitHub ותבנית PR
- **אחראי:** A (ראש צוות) · **תלוי ב:** T01 · **ענף:** `chore/T03-github-setup`

**הסבר מראש הצוות:** הגנה על `main` היא רשת הביטחון שלנו – גם אם סוכן AI "יתבלבל", GitHub לא יאפשר לו לדחוף ישר ל-main. תבנית ה-PR מכריחה כל אחד לכתוב איך בודקים, וזה בדיוק מה שהבודק ירצה לראות. את הגדרות ההגנה עושים ידנית באתר GitHub. **שימו לב:** בריפו פרטי בחשבון GitHub חינמי הגנת ענפים לא נאכפת. צריך GitHub Pro (חינם לסטודנטים דרך GitHub Student Developer Pack) או ארגון עם GitHub Team. בלי זה, ההגנה היא רק הכללים לסוכנים והקפדה של הצוות.

**ידני (ראש צוות):**
- [ ] Settings → Branches → Add rule ל-`main`: Require a pull request, 1 approval, Do not allow force pushes / deletions
- [ ] Settings → Code security → Secret scanning + Push protection (אם זמין)
- [ ] Settings → General → Pull Requests: להשאיר רק "Allow squash merging", ולסמן "Automatically delete head branches"

**הגדרת סיום:**
- [ ] ניסיון `git push origin main` נדחה
- [ ] PR חדש נפתח עם התבנית מולאת מראש

**איך בודקים שהמשימה בוצעה נכון** (R1–R6 רק ל-PR של התבניות; ההגדרות נבדקות ידנית):
```bash
git checkout main && git pull --rebase
git commit --allow-empty -m "test: branch protection" && git push origin main   # must be REJECTED (protected branch)
git reset --soft HEAD~1                                                         # drops only the local empty test commit
```
- [ ] הדחיפה נדחתה. אם עברה, ההגנה לא פעילה (ראו ההערה על GitHub Pro). commit ריק לא מזיק – מתקנים את ההגדרות ובודקים שוב
- [ ] PR חדש נפתח עם התבנית מולאת מראש: Task, What changed, How to test, Screenshots, צ'קליסט
- [ ] Issues → New issue → מופיעה תבנית ה-bug עם כל השדות
- [ ] Settings → General → Pull Requests: רק "Allow squash merging" מסומן, ו-"Automatically delete head branches" מסומן
- [ ] Settings → Branches (או Rules): ל-`main` – PR חובה, אישור אחד, בלי force push ובלי מחיקה
- [ ] אי אפשר לאשר PR של עצמכם – צריך חבר צוות אחר

**פרומפט:**
```
Task T03: GitHub PR template. Follow GIT_WORKFLOW.md: create branch chore/T03-github-setup from an up-to-date main before changing anything.

Create .github/pull_request_template.md with sections: "## Task" (T<NN> – title), "## What changed", "## How to test" (numbered steps + Expected), "## Screenshots (UI changes)", and the checklist from GIT_WORKFLOW.md section 3 as markdown checkboxes.
Also create .github/ISSUE_TEMPLATE/bug.md with: what happened, steps to reproduce, expected, screenshot, browser, local or cloud.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T03"), push the branch and open a PR. Do not merge.
```

---

# חלק 2: שרת, Docker וענן – מפתח A

## T04 – הגדרות, חיבור למסד, health ופורמט שגיאות
- **אחראי:** A · **תלוי ב:** T02 · **ענף:** `feat/T04-backend-foundation`

**הסבר מראש הצוות:** שלושה דברים שכל השאר נשען עליהם. (1) כל ההגדרות ממשתני סביבה – זה מה שיאפשר במטלה 4 להחליף את המקור ל-Secret Manager בלי לגעת בקוד. (2) פורמט שגיאה אחיד, כדי שהלקוח תמיד יוכל להציג `message`. (3) `/health` שבודק באמת את המסד – אם הוא מחזיר 200 כשהמסד למטה, נגלה בעיות רק מאוחר מדי. שימו לב ל-`pymongo[srv]`: בלעדיו כתובת Atlas (`mongodb+srv://`) לא תעבוד בענן.

**הגדרת סיום:**
- [ ] `uvicorn app.main:app` מקומי עם Mongo רץ → `/health` מחזיר 200
- [ ] Mongo כבוי → 503 עם `{"message": ...}`
- [ ] בקשה לנתיב לא קיים → 404 עם `{"message": ...}`

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
```bash
docker run -d --name ff-mongo -p 127.0.0.1:27017:27017 mongo:7
cd backend && source .venv/Scripts/activate        # see "הרצת טסטים לשרת"
export MONGO_URL=mongodb://localhost:27017 MONGO_DB=focusflow CORS_ORIGINS=http://localhost:3000
export JWT_SECRET=test-secret-that-is-at-least-32-characters
uvicorn app.main:app --port 8000                   # keep running; run the rest in a 2nd terminal
curl -i localhost:8000/health                      # 200 {"status":"ok"}
curl -i localhost:8000/nope                        # 404 {"message":"Not found"}
curl -si -H "Origin: http://localhost:3000" localhost:8000/health | grep -i access-control-allow-origin   # http://localhost:3000
curl -si -H "Origin: http://evil.example" localhost:8000/health | grep -ci access-control-allow-origin    # 0
docker stop ff-mongo && curl -i localhost:8000/health    # 503 {"message":"database unavailable"} after ~5 s
docker start ff-mongo && sleep 3 && curl -i localhost:8000/health   # 200 again
JWT_SECRET=short uvicorn app.main:app --port 8001  # exits at startup with a clear JWT_SECRET message
pytest -q                                          # all green
grep -rnE "mongodb://|change-me|localhost:" app/   # no output – nothing hardcoded
docker rm -f ff-mongo                              # from T05 on, Mongo comes from compose
```
- [ ] כל שגיאה היא JSON עם המפתח `message` (אין `detail`)
- [ ] `requirements.txt` כולל `pymongo[srv]`

**פרומפט:**
```
Task T04: backend foundation. Follow GIT_WORKFLOW.md: create branch feat/T04-backend-foundation from an up-to-date main before changing anything.

In backend/ create:
- requirements.txt: fastapi, uvicorn[standard], pymongo[srv]>=4.10, pydantic>=2, pydantic-settings, email-validator, bcrypt, PyJWT, pytest, pytest-asyncio, httpx
- app/config.py: Settings (pydantic-settings) with MONGO_URL, MONGO_DB, JWT_SECRET, JWT_EXPIRE_MINUTES (int, 60), CORS_ORIGINS (comma separated -> list[str]), GEMINI_API_KEY (default ""). Cached get_settings(). Fail fast with a clear error if JWT_SECRET is missing or shorter than 32 chars.
- app/db.py: one AsyncMongoClient created in the FastAPI lifespan (serverSelectionTimeoutMS=5000); the lifespan connects, awaits create_indexes() (a placeholder with a TODO list for now) and closes the client on shutdown; get_db() dependency.
- app/errors.py: handlers so every error is {"message": str}: HTTPException -> its status and detail; RequestValidationError -> 422 with a short readable message from the first error (field + reason); StarletteHTTPException (404 for unknown routes) -> {"message":"Not found"}; any other Exception -> 500 {"message":"Internal server error"} and log the traceback (never return it).
- app/main.py: app with lifespan, CORSMiddleware (allow_origins from settings, headers Authorization and Content-Type, all methods), register handlers, GET /health -> db.command("ping") -> 200 {"status":"ok"} or 503 {"message":"database unavailable"}.
- tests/conftest.py: async test client fixture using a separate database name (MONGO_DB + "_test") dropped after the session. Settings come from environment variables (MONGO_URL=mongodb://localhost:27017 when running pytest on the host).
- tests/test_health.py: /health returns 200 and {"status":"ok"}; unknown route returns 404 with "message".

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T04"), push the branch and open a PR. Do not merge.
```

## T05 – Dockerfile לשרת ו-Compose לפיתוח
- **אחראי:** A · **תלוי ב:** T04 · **ענף:** `infra/T05-backend-docker`

**הסבר מראש הצוות:** מהרגע הזה כולם מריצים את המערכת באותה צורה. הטעות הכי נפוצה: השרת מנסה להתחבר ל-`localhost:27017` – בתוך קונטיינר זה הקונטיינר עצמו, לכן משתמשים בשם השירות `mongodb`. ה-`--proxy-headers` נחוץ לענן, שם השרת יושב מאחורי מאזן עומסים.

**הגדרת סיום:**
- [ ] `cp .env.example .env && docker compose -f docker-compose.dev.yml up --build`
- [ ] `http://localhost:8000/health` → 200, `http://localhost:8000/docs` נפתח
- [ ] `docker compose ... down` ואז `up` – Mongo שומר נתונים (volume)

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
```bash
cp -n .env.example .env
docker compose -f docker-compose.dev.yml up --build -d
docker compose -f docker-compose.dev.yml ps                       # mongodb and backend: healthy
curl -s localhost:8000/health                                     # {"status":"ok"}  (and http://localhost:8000/docs opens)
docker compose -f docker-compose.dev.yml exec backend whoami      # not root
docker compose -f docker-compose.dev.yml exec backend ls -a /app  # app/ and requirements.txt – no tests/, no .env
grep MONGO_URL .env.example                                       # mongodb://mongodb:27017 (service name)
docker compose -f docker-compose.dev.yml stop mongodb && curl -s localhost:8000/health   # 503 + message
docker compose -f docker-compose.dev.yml start mongodb
mq 'db.probe.insertOne({x:1})'
docker compose -f docker-compose.dev.yml down && docker compose -f docker-compose.dev.yml up -d
mq 'db.probe.countDocuments()'                                    # 1 – the volume kept the data
mq 'db.probe.drop()'
docker compose -f docker-compose.dev.yml images backend           # image name for the next line
docker history --no-trunc <backend-image> | grep -iE "JWT_SECRET=|MONGO_URL=|password"   # no output
```
- [ ] "הרצת טסטים לשרת" עובד מול ה-Mongo של ה-Compose (הפורט פתוח רק ל-127.0.0.1)
- [ ] בנייה שנייה בלי שינוי ב-`requirements.txt` מהירה (שכבת pip מה-cache)

**פרומפט:**
```
Task T05: backend Docker and dev compose. Follow GIT_WORKFLOW.md: create branch infra/T05-backend-docker from an up-to-date main before changing anything.

Create:
- backend/Dockerfile: python:3.12-slim, non-root user, WORKDIR /app, copy requirements.txt and pip install --no-cache-dir first (layer cache), then copy app/. EXPOSE 8000. CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8000","--proxy-headers","--forwarded-allow-ips=*"]
- backend/.dockerignore: .env, __pycache__, .pytest_cache, tests, .venv
- docker-compose.dev.yml (repo root):
  mongodb: image mongo:7, ports "127.0.0.1:27017:27017" (localhost only, so pytest can run from the host), volume mongo_data:/data/db, healthcheck mongosh --quiet --eval "db.adminCommand('ping')" every 10s.
  backend: build ./backend, ports "8000:8000", env_file .env, depends_on mongodb (condition: service_healthy), healthcheck with python -c urllib request to http://localhost:8000/health.
  A commented-out frontend service placeholder.
  volumes: mongo_data.
Make sure MONGO_URL in .env.example uses the service name mongodb, not localhost.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T05"), push the branch and open a PR. Do not merge.
```

## T06 – חשבונות ענן (ידני, אין קוד)
- **אחראי:** A · **תלוי ב:** – (מתחילים ביום 1) · **ענף:** אין

**הסבר מראש הצוות:** כל מה שכאן מחכה למשהו חיצוני (אישור חשבון, DNS, תעודה), ולכן עושים אותו ראשון. אל תלחצו Upgrade בחשבון Google – נשארים על 300$ קרדיט. את ה-connection string של Atlas שומרים רק במנהל סיסמאות משותף, אף פעם לא בצ'אט או בקובץ.

**צ'קליסט:**
- [ ] Google Cloud Free Trial, פרויקט חדש, חברי הצוות ב-IAM כ-Editor
- [ ] Billing → Budgets & alerts: 300$ עם התראות ב-25%/50%/90%
- [ ] `gcloud init` אצל A, אזור `me-west1`
- [ ] MongoDB Atlas: cluster M0, משתמש מסד עם סיסמה אקראית ארוכה, Network Access `0.0.0.0/0` (נימוק להגנה: ל-Cloud Run אין IP יציאה קבוע בלי NAT בתשלום; ההגנה היא סיסמה חזקה ו-TLS)
- [ ] No-IP: hostname חינמי אחד, התראות מייל פעילות (אישור כל 30 יום)
- [ ] חשבון Docker Hub; שני repositories ציבוריים: `focusflow-backend`, `focusflow-frontend`
- [ ] בחירת מזהה פרויקט באנגלית (למשל `focus-ninjas`) – שם קובץ ה-JSON להגשה

**איך בודקים שהמשימה בוצעה נכון** (ידני – A מראה למישהו מהצוות):
```bash
gcloud config list                                   # project = <PROJECT_ID>
gcloud config get-value compute/region               # me-west1
gcloud projects get-iam-policy <PROJECT_ID> --flatten="bindings[].members" \
  --format="table(bindings.role,bindings.members)" | grep -E "editor|owner"   # every team member
gcloud billing projects describe <PROJECT_ID>        # billingEnabled: true
# Atlas – mongosh asks for the password, so it is not saved in shell history:
docker run --rm -it mongo:7 mongosh "mongodb+srv://<cluster-host>/" --username <db-user> --eval "db.adminCommand('ping')"   # { ok: 1 }
curl -s https://hub.docker.com/v2/repositories/<user>/focusflow-backend/  | grep -o '"is_private":[a-z]*'   # "is_private":false
curl -s https://hub.docker.com/v2/repositories/<user>/focusflow-frontend/ | grep -o '"is_private":[a-z]*'   # "is_private":false
nslookup <no-ip-host>                                # resolves (any IP for now)
```
- [ ] Billing → Overview: עדיין Free Trial עם קרדיט (לא לחצו Upgrade)
- [ ] Billing → Budgets & alerts: תקציב 300$ עם 25%/50%/90%, וההתראות נשלחות לכל הצוות
- [ ] Atlas → Network Access: `0.0.0.0/0`; Database Access: משתמש עם הרשאת קריאה/כתיבה בלבד (לא Atlas admin)
- [ ] ה-connection string רק במנהל הסיסמאות: `git log -p --all | grep -c "mongodb+srv://.*@"` → 0
- [ ] No-IP: התראות מייל פעילות
- [ ] מזהה הפרויקט (למשל `focus-ninjas`) רשום בהודעה מוצמדת לצוות – אותיות קטנות, ספרות ומקפים בלבד

## T07 – סקריפטים: בנייה, דחיפה וסודות
- **אחראי:** A · **תלוי ב:** T05, T06 · **ענף:** `infra/T07-build-and-secrets`

**הסבר מראש הצוות:** שני סקריפטים שנריץ עשרות פעמים. `build-and-push.sh` חייב `--platform linux/amd64` – אחרת מחשבי Mac עם שבב Apple בונים תמונה שלא רצה אצל הבודק ובענן. `setup-secrets.sh` קורא את הסודות בהקלדה נסתרת (`read -s`), ולכן הם לא נשמרים בהיסטוריית הטרמינל ולא בשום קובץ. ל-Service Account של השרת נותנים רק הרשאת קריאת סודות – עיקרון ההרשאה המינימלית, שאלה שתבוא בהגנה.

**הגדרת סיום:**
- [ ] `DOCKER_USER=<user> scripts/build-and-push.sh` מעלה תמונה ל-Docker Hub
- [ ] `docker manifest inspect <user>/focusflow-backend:<tag>` מציג `amd64`
- [ ] ב-Console → Secret Manager רואים `mongo-url` ו-`jwt-secret` (בלי לראות ערכים בסקריפט)

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
```bash
docker run --rm -v "$PWD:/mnt" -w /mnt koalaman/shellcheck:stable scripts/build-and-push.sh scripts/gcp/setup-secrets.sh   # no output
git ls-files -s scripts/build-and-push.sh scripts/gcp/setup-secrets.sh   # mode 100755 (Windows: git update-index --chmod=+x <file>)
docker login
DOCKER_USER=<user> scripts/build-and-push.sh                # prints <user>/focusflow-backend:<hash>; frontend skipped with a message
docker manifest inspect <user>/focusflow-backend:<hash> | grep architecture   # "amd64"
DOCKER_USER= scripts/build-and-push.sh; echo "exit=$?"      # clear error, exit != 0
PROJECT_ID=<id> scripts/gcp/setup-secrets.sh                # typed values are not shown on screen
PROJECT_ID=<id> scripts/gcp/setup-secrets.sh                # 2nd run: answer N everywhere – no errors, nothing changes
gcloud secrets list --format="value(name)"                  # mongo-url, jwt-secret (+ gemini-key only if entered)
gcloud secrets get-iam-policy jwt-secret                    # ff-backend-sa has roles/secretmanager.secretAccessor (same for mongo-url)
gcloud projects get-iam-policy <id> --flatten="bindings[].members" \
  --filter="bindings.members:ff-backend-sa" --format="value(bindings.role)"   # empty – no project-wide roles
```
- [ ] קריאת קוד: סודות נקראים רק עם `read -s` ועוברים ב-`printf '%s' ... |`; אין `echo` של ערך, אין `set -x`, אין סוד כארגומנט
- [ ] `history | tail -30` – אין ערך סוד
- [ ] `scripts/README.md` מסביר את שני הסקריפטים

**פרומפט:**
```
Task T07: build/push and secrets scripts. Follow GIT_WORKFLOW.md: create branch infra/T07-build-and-secrets from an up-to-date main before changing anything.

1. scripts/build-and-push.sh (bash, set -euo pipefail): env DOCKER_USER (required) and TAG (default: git rev-parse --short HEAD). For each of backend and frontend (skip frontend if frontend/Dockerfile does not exist):
   docker buildx build --platform linux/amd64 -t "$DOCKER_USER/focusflow-<name>:$TAG" --push ./<name>
   Print the pushed image names. Header comment: repositories must be PUBLIC and images must never contain secrets.
2. scripts/gcp/setup-secrets.sh (bash, set -euo pipefail): env PROJECT_ID (required), REGION default me-west1.
   - gcloud services enable run.googleapis.com compute.googleapis.com secretmanager.googleapis.com
   - create service account ff-backend-sa if missing
   - for mongo-url and jwt-secret: create the secret if missing (--replication-policy=automatic); ask "Add a new version? [y/N]"; read the value with read -s (never as an argument, never echoed) and pipe it with printf '%s' to gcloud secrets versions add --data-file=- . For jwt-secret offer "generate random" which pipes python3 -c "import secrets;print(secrets.token_urlsafe(48),end='')" directly.
   - gemini-key: only if the user types a non-empty value.
   - grant roles/secretmanager.secretAccessor to ff-backend-sa on each existing secret (gcloud secrets add-iam-policy-binding).
   - print what was created, never values.
3. scripts/README.md explaining both scripts in 10 lines.
Make the scripts executable (chmod +x) and shellcheck-clean.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T07"), push the branch and open a PR. Do not merge.
```

## T08 – פריסה ל-Cloud Run
- **אחראי:** A · **תלוי ב:** T07 · **ענף:** `infra/T08-cloud-run-deploy`

**הסבר מראש הצוות:** פריסה ראשונה של השרת לענן, עוד לפני שיש בו הרשמה. המטרה: לוודא שהצינור עובד (תמונה → Cloud Run → סודות → Atlas). אם `/health` של ה-run.app מחזיר 503 – הבעיה כמעט תמיד ב-Network Access של Atlas או בערך הסוד. ללקוח מגדירים `API_URL=` ריק, כי בענן הוא פונה לשרת באותו דומיין.

**הגדרת סיום:**
- [ ] `scripts/gcp/deploy.sh` מסתיים, ו-`https://ff-backend-...run.app/health` → 200
- [ ] ב-Cloud Run → ff-backend → Variables & Secrets: `MONGO_URL` ו-`JWT_SECRET` מופיעים כ-Secret, לא כטקסט

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
```bash
PROJECT_ID=<id> DOCKER_USER=<user> DOMAIN=<host> scripts/gcp/deploy.sh   # finishes, prints 2 run.app URLs + health
curl -s https://ff-backend-<...>.run.app/health                          # {"status":"ok"} – connected to Atlas
gcloud run services describe ff-backend --region me-west1 --format=export | grep -A4 -E "name: (MONGO_URL|JWT_SECRET)"
   # each one has valueFrom.secretKeyRef (mongo-url / jwt-secret) – never "value:"
gcloud run services describe ff-backend --region me-west1 --format="value(spec.template.spec.serviceAccountName)"   # ff-backend-sa@...
gcloud run services list --region me-west1                               # ff-backend and ff-frontend
PROJECT_ID=<id> DOCKER_USER=<user> DOMAIN=<host> scripts/gcp/deploy.sh   # 2nd run succeeds too (new revision)
docker run --rm -v "$PWD:/mnt" -w /mnt koalaman/shellcheck:stable scripts/gcp/deploy.sh   # no output
```
- [ ] Console → Cloud Run → ff-backend → Variables & Secrets: `MONGO_URL` ו-`JWT_SECRET` מסומנים כ-Secret
- [ ] אם עוד אין תמונת לקוח, ff-frontend הוא placeholder של תמונת השרת, והסקריפט הדפיס אזהרה
- [ ] 503? בודקים את Network Access ב-Atlas ואת ערך הסוד `mongo-url`, לא את הקוד

**פרומפט:**
```
Task T08: Cloud Run deploy script. Follow GIT_WORKFLOW.md: create branch infra/T08-cloud-run-deploy from an up-to-date main before changing anything.

Create scripts/gcp/deploy.sh (bash, set -euo pipefail). Env: PROJECT_ID, DOCKER_USER, DOMAIN (required), REGION=me-west1, TAG (default git short hash). Flags: --grading (backend min instances 1), --frontend-image <image> (optional override).
Steps:
1. Build the --set-secrets list: MONGO_URL=mongo-url:latest,JWT_SECRET=jwt-secret:latest, plus GEMINI_API_KEY=gemini-key:latest only if `gcloud secrets describe gemini-key` succeeds.
2. gcloud run deploy ff-backend --image=docker.io/$DOCKER_USER/focusflow-backend:$TAG --region=$REGION --port=8000 --allow-unauthenticated --service-account=ff-backend-sa@$PROJECT_ID.iam.gserviceaccount.com --set-secrets=<list> --set-env-vars=MONGO_DB=focusflow,JWT_EXPIRE_MINUTES=60,CORS_ORIGINS=https://$DOMAIN --min-instances=<0 or 1> --max-instances=3 --memory=512Mi
3. Frontend: if docker.io/$DOCKER_USER/focusflow-frontend:$TAG exists (docker manifest inspect) deploy it as ff-frontend with --port=3000 --set-env-vars=API_URL= --min-instances=0 --max-instances=3 --memory=256Mi --allow-unauthenticated. If it does not exist yet AND ff-frontend service does not exist, deploy the backend image as a temporary ff-frontend placeholder (so the load balancer can be created) and print a warning.
4. Print both run.app URLs and curl -fsS <backend-url>/health.
5. If https://$DOMAIN resolves, also curl https://$DOMAIN/health and print the result.
Before using any gcloud flag you are unsure about, check it with --help.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T08"), push the branch and open a PR. Do not merge.
```

## T09 – מאזן עומסים, תעודה ודומיין
- **אחראי:** A · **תלוי ב:** T08 · **ענף:** `infra/T09-load-balancer`

**הסבר מראש הצוות:** בלי HTTPS המצלמה לא נדלקת בכלל, לכן זו לא תוספת – זה חלק מהליבה. מגדירים פעם אחת: IP קבוע, Serverless NEG לכל שירות, URL map (`/api/*` ו-`/health` לשרת, השאר ללקוח), תעודה מנוהלת, ו-forwarding rule על 443. התעודה יכולה להיות ב-PROVISIONING עד שעה ויותר – זה תקין. ב-No-IP רשומת A אחת בלבד, לכתובת של המאזן. מאזן עומסים עולה כסף כל שעה – לבדוק ב-Budget.

**הגדרת סיום:**
- [ ] `nslookup <domain>` מחזיר את כתובת `ff-ip`
- [ ] סטטוס התעודה `ACTIVE`
- [ ] `https://<domain>/health` → 200 בלי אזהרת אבטחה

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
```bash
PROJECT_ID=<id> DOMAIN=<host> scripts/gcp/setup-lb.sh      # prints the IP and the cert watch command
PROJECT_ID=<id> DOMAIN=<host> scripts/gcp/setup-lb.sh      # 2nd run: skips existing resources, no errors
gcloud compute addresses describe ff-ip --global --format="value(address)"
nslookup <host>                                            # exactly that one IP
gcloud compute ssl-certificates describe ff-cert --global --format="get(managed.status,managed.domainStatus)"   # ACTIVE
curl -si https://<host>/health                             # 200 {"status":"ok"} – no -k, the cert is valid
curl -s https://<host>/api/does-not-exist                  # {"message":"Not found"} – /api/* reaches the backend
curl -sI https://<host>/library | head -1                  # answered by ff-frontend (after T20: 200 text/html)
gcloud compute url-maps describe ff-urlmap --format=yaml | grep -B2 -A6 pathRules   # /api/* and /health → ff-backend-bs
bash -n scripts/gcp/teardown-lb.sh                         # syntax OK – do NOT run it now
docker run --rm -v "$PWD:/mnt" -w /mnt koalaman/shellcheck:stable scripts/gcp/setup-lb.sh scripts/gcp/teardown-lb.sh
```
- [ ] בדפדפן: `https://<host>/health` עם מנעול, בלי אזהרה
- [ ] `teardown-lb.sh` מבקש אישור לפני מחיקה (קריאת קוד)
- [ ] `scripts/README.md`: סדר הסקריפטים, PROVISIONING / FAILED_NOT_VISIBLE, תזכורת No-IP
- [ ] Billing → Reports: עלות המאזן מופיעה ואין חריגה מהתקציב

**פרומפט:**
```
Task T09: global HTTPS load balancer for Cloud Run. Follow GIT_WORKFLOW.md: create branch infra/T09-load-balancer from an up-to-date main before changing anything.

Create scripts/gcp/setup-lb.sh (bash, set -euo pipefail, idempotent: check with `describe` and skip existing resources). Env: PROJECT_ID, DOMAIN (required), REGION=me-west1. Follow Google's guide "Set up a global external Application Load Balancer with Cloud Run" and verify flags with --help:
1. global static IP ff-ip; print it.
2. serverless NEGs in $REGION: ff-backend-neg -> Cloud Run service ff-backend, ff-frontend-neg -> ff-frontend.
3. global backend services with --load-balancing-scheme=EXTERNAL_MANAGED: ff-backend-bs, ff-frontend-bs; add each NEG (--network-endpoint-group-region=$REGION). No health checks (not supported for serverless NEGs).
4. URL map ff-urlmap: default ff-frontend-bs; path matcher for host $DOMAIN: /api/* and /health -> ff-backend-bs.
5. Google-managed SSL certificate ff-cert for $DOMAIN.
6. target HTTPS proxy ff-https-proxy, global forwarding rule ff-https-rule (EXTERNAL_MANAGED, port 443, address ff-ip).
7. Print: the IP to put in the DNS A record (only this IP), and the command to watch the cert:
   gcloud compute ssl-certificates describe ff-cert --global --format="get(managed.status,managed.domainStatus)"
Also create scripts/gcp/teardown-lb.sh that deletes these resources in reverse order, asking for confirmation first (for after the grading window).
Add a section to scripts/README.md: order of scripts, what PROVISIONING / FAILED_NOT_VISIBLE mean, and that the No-IP host must be confirmed every 30 days.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T09"), push the branch and open a PR. Do not merge.
```

## T10 – משתמשים: אינדקסים ו-security.py
- **אחראי:** A · **תלוי ב:** T04 · **ענף:** `feat/T10-user-model-security`

**הסבר מראש הצוות:** ההחלטות כאן נכנסות ישירות לסעיף האבטחה ב-PROJECT_INFO (בונוס עד 9 נקודות), אז רשמו לעצמכם את הערכים: bcrypt cost 12, JWT HS256 60 דקות, `jti` לביטול טוקן ו-`ver` לביטול כל הטוקנים בהחלפת סיסמה. האינדקס הייחודי על `email_lower` הוא מה שבאמת מונע הרשמה כפולה, גם בשתי בקשות במקביל. bcrypt מוגבל ל-72 בתים – לכן מגבילים את אורך הסיסמה.

**הגדרת סיום:**
- [ ] טסטי יחידה: hash ו-verify עובדים; סיסמה חלשה נדחית; טוקן פג תוקף נדחה; טוקן עם סוד אחר נדחה

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
```bash
cd backend && pytest -q tests/test_security.py -v   # tests for: hash+verify, wrong password, length 8..72 bytes,
                                                    # no letter, no digit, contains email name, expired token,
                                                    # token signed with another secret, missing claims
cd .. && docker compose -f docker-compose.dev.yml up --build -d
mq 'printjson(db.users.getIndexes())'               # email_lower with unique: true
mq 'printjson(db.revoked_tokens.getIndexes())'      # jti unique; expires_at with expireAfterSeconds: 0
mq 'printjson(db.login_attempts.getIndexes())'      # created_at with expireAfterSeconds: 900; email_lower
mq 'printjson(db.content.getIndexes()); printjson(db.sessions.getIndexes())'   # (owner_id, created_at -1); (owner_id, started_at -1), content_id
grep -n "rounds=12" backend/app/security.py && grep -n "HS256" backend/app/security.py
grep -rnE "(log|print)[a-z_.]*\(.*(password|token|hash)" backend/app   # no output
```
- [ ] `UserOut` לא כולל `password_hash` (קוד + טסט)
- [ ] `parse_object_id("abc")` → 404, ו-`iso()` מחזיר `YYYY-MM-DDTHH:MM:SS.sssZ` (טסטים)

**פרומפט:**
```
Task T10: user model, indexes and security helpers. Follow GIT_WORKFLOW.md: create branch feat/T10-user-model-security from an up-to-date main before changing anything.

- app/db.py create_indexes(): users.email_lower unique; content (owner_id, created_at -1); sessions (owner_id, started_at -1) and content_id; revoked_tokens jti unique + TTL on expires_at (expireAfterSeconds=0); login_attempts TTL on created_at (900s) + index email_lower.
- User doc: {_id, email, email_lower, password_hash, display_name, token_version: 0, created_at}.
- app/schemas/users.py: RegisterIn(email: EmailStr, password: str, display_name: str stripped 1-50), LoginIn, UserOut(id, email, display_name, created_at). Helper to_user_out(doc). UserOut must never include password_hash.
- app/utils.py: iso(dt) -> "YYYY-MM-DDTHH:MM:SS.sssZ" in UTC; parse_object_id(id) raising HTTPException 404 {"Not found"} on invalid ids.
- app/security.py: hash_password with bcrypt.gensalt(rounds=12) (bcrypt library directly, not passlib); verify_password; validate_password_strength(password, email): 8..72 bytes, at least one letter and one digit, must not contain the email local part (case-insensitive) -> HTTPException 422 with a clear message; create_access_token(user_id, token_version) -> (token, expires_in) with claims sub, ver, jti (uuid4), iat, exp; decode_token(token) -> claims or HTTPException 401 {"Invalid or expired token"} (require sub, jti, exp, ver).
- tests/test_security.py covering all of the above.
Never log passwords, hashes or tokens.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T10"), push the branch and open a PR. Do not merge.
```

## T11 – הרשמה והתחברות
- **אחראי:** A · **תלוי ב:** T10 · **ענף:** `feat/T11-register-login`

**הסבר מראש הצוות:** שני סעיפי ציון שלמים (20 נקודות). הבודק ינסה אימייל קיים וסיסמה קצרה – ההודעות צריכות להיות ברורות. בהתחברות, אותה הודעה לאימייל לא קיים ולסיסמה שגויה, כדי לא לחשוף מי רשום. הגבלת הניסיונות נשמרת ב-Mongo ולא בזיכרון – אחרת בענן, עם כמה מופעים, היא לא תעבוד.

**הגדרת סיום:**
- [ ] 201 בהרשמה; 409 לאותו אימייל באותיות גדולות; 422 לסיסמה קצרה
- [ ] 200 עם `access_token`, `token_type: "bearer"`, `expires_in`; 401 לסיסמה שגויה; 429 בניסיון השישי

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
```bash
docker compose -f docker-compose.dev.yml up --build -d     # then paste the API helpers
reg alice@test.com                       # 201 {"id","email","display_name"} – no password_hash
reg ALICE@Test.com                       # 409 {"message":"Email already registered"}
reg short@test.com 'abc1'                # 422 with a clear message (length)
reg nodigit@test.com 'abcdefghij'        # 422 (needs a digit)
reg dana@test.com 'dana12345'            # 422 (contains the email name)
reg not-an-email                         # 422 {"message": ...} from the validation handler
lg alice@test.com                        # 200 access_token, token_type "bearer", expires_in 3600
A=$(tok alice@test.com)
python -c "import jwt,sys;c=jwt.decode(sys.argv[1],options={'verify_signature':False});print(sorted(c),c['exp']-c['iat'])" "$A"
                                         # ['exp','iat','jti','sub','ver'] 3600
lg alice@test.com Wrong1234              # 401 {"message":"Incorrect email or password"}
lg nobody@test.com Wrong1234             # identical body and status
reg bob@test.com >/dev/null
for i in 1 2 3 4 5; do lg bob@test.com Wrong1234 | tail -1; done   # 401 x5
lg bob@test.com Wrong1234 | tail -1      # 429
lg bob@test.com | tail -1                # 429 even with the right password (blocked for 15 minutes)
mq 'db.users.findOne({email_lower:"alice@test.com"},{password_hash:1})'   # starts with $2b$12$
mq 'db.login_attempts.countDocuments({email_lower:"alice@test.com"})'     # 0 – cleared after the successful login
reg race@test.com | tail -1 & reg race@test.com | tail -1 & wait          # exactly one 201 and one 409
docker compose -f docker-compose.dev.yml logs backend | grep -c Passw0rd  # 0
```
- [ ] `password_hash` לא מופיע באף אחד מהפלטים
- [ ] pytest ירוק

**פרומפט:**
```
Task T11: register and login. Follow GIT_WORKFLOW.md: create branch feat/T11-register-login from an up-to-date main before changing anything.

app/routers/auth.py (prefix /api/auth), registered in main.py:
- POST /register: RegisterIn + validate_password_strength; email_lower = email.strip().lower(); existing -> 409 {"message":"Email already registered"}; insert (DuplicateKeyError -> 409 as well); 201 {id, email, display_name}.
- POST /login: if count of login_attempts for email_lower in the last 15 minutes >= 5 -> 429 {"message":"Too many failed attempts. Try again in 15 minutes."}. Unknown email or wrong password -> insert a login_attempts doc and 401 {"message":"Incorrect email or password"} (identical message). Success -> delete that email's attempts, 200 {access_token, token_type:"bearer", expires_in}.
State lives only in MongoDB (multiple instances in the cloud).
tests/test_auth.py: register 201; duplicate with different case 409; short password 422; weak password (no digit) 422; login ok; wrong password 401; unknown email 401 with the same message; 6th failure 429; password_hash never in any response body.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T11"), push the branch and open a PR. Do not merge.
```

## T12 – זיהוי משתמש, התנתקות ו-/me
- **אחראי:** A · **תלוי ב:** T11 · **ענף:** `feat/T12-auth-dependency`

**הסבר מראש הצוות:** `get_current_user` הוא השומר של כל המערכת – כל נתיב "מחובר" עובר דרכו. התנתקות אמיתית ב-JWT דורשת רשימת ביטול (אחרת הטוקן ממשיך לעבוד עד שפג). הבודק בודק התנתקות דרך הדפדפן, ואנחנו בודקים גם ב-API.

**הגדרת סיום:**
- [ ] `/api/users/me` בלי טוקן → 401; טוקן משובש → 401; טוקן תקין → 200 עם `created_at`
- [ ] אחרי `logout` אותו טוקן → 401

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
```bash
A=$(tok alice@test.com)
curl -s -w '\n%{http_code}\n' $API/api/users/me     # 401 {"message":"Not authenticated"}
call GET /api/users/me garbage                      # 401
FAKE=$(python -c "import jwt,time,uuid;n=int(time.time());print(jwt.encode({'sub':'0'*24,'ver':0,'jti':str(uuid.uuid4()),'iat':n,'exp':n+600},'another-secret-another-secret-12345',algorithm='HS256'))")
call GET /api/users/me "$FAKE"                      # 401 – signed with another secret
call GET /api/users/me "$A"                         # 200 id, email, display_name, created_at ("...Z"); no password_hash
call POST /api/auth/logout "$A"                     # 204
call GET /api/users/me "$A"                         # 401 – the token was revoked
mq 'db.revoked_tokens.findOne()'                    # {jti, expires_at}
```
- [ ] ב-`/docs` יש כפתור Authorize; אחרי הדבקת טוקן `/api/users/me` עובד
- [ ] (אופציונלי) טוקן שפג: `JWT_EXPIRE_MINUTES=1` ב-`.env`, `docker compose -f docker-compose.dev.yml up -d backend`, אחרי 61 שניות → 401; מחזירים ל-60
- [ ] pytest ירוק

**פרומפט:**
```
Task T12: auth dependency, logout and /me. Follow GIT_WORKFLOW.md: create branch feat/T12-auth-dependency from an up-to-date main before changing anything.

- app/deps.py get_current_user: HTTPBearer(auto_error=False) (so /docs has Authorize); missing/invalid scheme -> 401 {"message":"Not authenticated"}; decode_token; jti in revoked_tokens -> 401; load user by ObjectId(sub); missing user or token_version != ver -> 401. Return a small object with user doc and claims.
- POST /api/auth/logout (auth): insert {jti, expires_at: datetime from exp} into revoked_tokens (ignore duplicate); 204.
- app/routers/users.py (prefix /api/users): GET /me -> UserOut incl. created_at.
- tests: /me 401 without token, 401 with garbage token, 401 with token signed by another secret, 200 with a valid one; logout -> 204 then same token 401.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T12"), push the branch and open a PR. Do not merge.
```

## T13 – API תוכן
- **אחראי:** A · **תלוי ב:** T12 · **ענף:** `feat/T13-content-api`

**הסבר מראש הצוות:** סעיף "תוכן" (14) וסעיף "הפרדה" (8). שני כללים: (1) כל שאילתה מסננת `owner_id` מהטוקן; (2) מזהה לא תקין, לא קיים, ושל משתמש אחר – כולם אותו 404 בדיוק. אימות YouTube בשרת חוסם גם קישורים זדוניים כמו `javascript:` או `youtube.com.evil.com`. שומרים `video_id` כדי שהלקוח לא יצטרך לפענח קישורים.

**הגדרת סיום:**
- [ ] משתמש B לא רואה ולא מוחק פריטים של A (404)
- [ ] קישור שגוי → 422 עם הודעה; `GET /api/content/abc` → 404

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
```bash
A=$(tok alice@test.com); reg carol@test.com >/dev/null; B=$(tok carol@test.com)
V=$(call POST /api/content "$A" '{"title":"Video","type":"youtube","source":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' | tee /dev/stderr | jid)   # 201, video_id "dQw4w9WgXcQ"
call POST /api/content "$A" '{"title":"Short link","type":"youtube","source":"https://youtu.be/dQw4w9WgXcQ"}'          # 201
call POST /api/content "$A" '{"title":"Shorts","type":"youtube","source":"https://www.youtube.com/shorts/dQw4w9WgXcQ"}' # 201
call POST /api/content "$A" '{"title":"x","type":"youtube","source":"https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ"}'  # 422 Invalid YouTube link
call POST /api/content "$A" '{"title":"x","type":"youtube","source":"javascript:alert(1)"}'   # 422
call POST /api/content "$A" '{"title":"x","type":"text","source":"too short"}'               # 422
call POST /api/content "$A" '{"title":"x","type":"pdf","source":"abc"}'                       # 422
call POST /api/content "$A" '{"title":"","type":"youtube","source":"https://youtu.be/dQw4w9WgXcQ"}'   # 422
LONG=$(python -c "print('a'*500)")
T=$(call POST /api/content "$A" "{\"title\":\"<b>Text</b>\",\"type\":\"text\",\"source\":\"$LONG\"}" | jid)
call GET /api/content "$A" | head -1 | python -c "import sys,json;d=json.load(sys.stdin);print([(i['type'],len(i['source'])) for i in d])"
                                         # newest first; the text item has 200 chars in the list
call GET /api/content/$T "$A"            # full 500 chars; title "<b>Text</b>" stored as-is
call GET /api/content "$B"               # []
call GET /api/content/$V "$B"            # 404 {"message":"Content not found"}
call DELETE /api/content/$V "$B"         # 404
call GET /api/content/$V "$A"            # 200 – still exists
call GET /api/content/abc "$A"           # 404, same message
call DELETE /api/content/$V "$A"         # 204; GET again → 404
```
- [ ] pytest ירוק, כולל 6 קישורים תקינים ו-6 לא תקינים

**פרומפט:**
```
Task T13: content API. Follow GIT_WORKFLOW.md: create branch feat/T13-content-api from an up-to-date main before changing anything.

- app/content_validation.py: extract_youtube_id(url): only http/https and hosts youtube.com, www.youtube.com, m.youtube.com, youtu.be; supports /watch?v=, youtu.be/<id>, /shorts/<id>, /embed/<id>; id ^[A-Za-z0-9_-]{11}$; else None. validate_text(text): stripped, 20..100000 chars.
- app/schemas/content.py: ContentIn(title 1-200 stripped, type Literal["youtube","text"], source str), ContentOut(id, title, type, source, video_id | None, created_at).
- app/routers/content.py (auth on all):
  POST /api/content -> 201; invalid YouTube -> 422 {"message":"Invalid YouTube link"}; invalid text -> 422; unsupported type -> 422.
  GET /api/content -> owner's items newest first; text items return source truncated to 200 chars in the list.
  GET /api/content/{id} -> full item; invalid id / missing / other owner -> 404 {"message":"Content not found"}.
  DELETE /api/content/{id} -> same 404 rules; also delete the owner's sessions for that content; 204.
- tests: unit tests for extract_youtube_id (6 valid, 6 invalid incl. javascript:, youtube.com.evil.com, wrong length); isolation test with two users (list empty, GET 404, DELETE 404 and item still exists for owner).

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T13"), push the branch and open a PR. Do not merge.
```

## T14 – API סשנים ומדידות
- **אחראי:** A · **תלוי ב:** T13 · **ענף:** `feat/T14-sessions-api`

**הסבר מראש הצוות:** צד השרת של הסעיף הכי שווה (26). המדידות נשמרות כמערך בתוך מסמך הסשן – פשוט ומהיר, וסשן של שעה הוא רק כ-1,800 מדידות. סשן סגור דוחה מדידות ב-409. ברשימת הסשנים לא מחזירים את המערך עצמו – רק ספירה וממוצע – כדי שההיסטוריה תיטען מהר.

**הגדרת סיום:**
- [ ] 3 מדידות (0.2, 0.6, 1.0) → סיום → ממוצע 0.6 ו-3 מדידות
- [ ] מדידה אחרי סיום → 409; ציון 1.5 → 422; סשן של אחר → 404

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
```bash
A=$(tok alice@test.com); B=$(tok carol@test.com)
C=$(call POST /api/content "$A" '{"title":"v","type":"youtube","source":"https://youtu.be/dQw4w9WgXcQ"}' | jid)
S=$(call POST /api/sessions "$A" "{\"content_id\":\"$C\"}" | tee /dev/stderr | jid)    # 201 {id, content_id, started_at}
for s in 0.2 0.6 1.0; do call POST /api/sessions/$S/readings "$A" "{\"position\":5,\"score\":$s}" | tail -1; done   # 201 x3
call POST /api/sessions/$S/end "$A"           # 200 reading_count 3, average_score 0.6, ended_at "...Z"
call POST /api/sessions/$S/end "$A"           # 200 – identical summary (same ended_at)
call POST /api/sessions/$S/readings "$A" '{"position":6,"score":0.5}'    # 409 {"message":"Session already ended"}
S2=$(call POST /api/sessions "$A" "{\"content_id\":\"$C\"}" | jid)
call POST /api/sessions/$S2/readings "$A" '{"position":1,"score":1.5}'   # 422
call POST /api/sessions/$S2/readings "$A" '{"position":-1,"score":0.5}'  # 422
call GET /api/sessions/$S "$B"                                           # 404
call POST /api/sessions/$S/end "$B"                                      # 404
call POST /api/sessions/$S2/readings "$B" '{"position":1,"score":0.5}'   # 404 (not 201/409)
call POST /api/sessions "$B" "{\"content_id\":\"$C\"}"                   # 404
call POST /api/sessions/$S2/end "$A"          # average_score null, reading_count 0
call GET /api/sessions "$A" | grep -c '"readings"'   # 0 – the list has no readings array
call GET /api/sessions/$S "$A"                # summary + readings [3 items]
call GET /api/sessions/abc "$A"               # 404
call DELETE /api/content/$C "$A" && call GET /api/sessions/$S "$A"   # 204, then 404 – sessions deleted with the content
```
- [ ] pytest ירוק

**פרומפט:**
```
Task T14: sessions and readings API. Follow GIT_WORKFLOW.md: create branch feat/T14-sessions-api from an up-to-date main before changing anything.

Session doc: {owner_id, content_id, content_title, started_at, ended_at: null, readings: [{position, score, created_at}]}.
app/routers/sessions.py (auth on all):
- POST /api/sessions {content_id}: content must exist and be owned, else 404. 201 {id, content_id, started_at}.
- POST /api/sessions/{id}/readings {position: float >= 0, score: float 0..1 (Field ge/le)}: one update_one with filter {_id, owner_id, ended_at: None} and $push; if matched 0 -> look up: not owner's/missing -> 404, ended -> 409 {"message":"Session already ended"}. 201 {position, score, created_at}.
- POST /api/sessions/{id}/end: sets ended_at if not set (idempotent). 200 summary {id, content_id, content_title, started_at, ended_at, reading_count, average_score (null if none, else rounded to 3 decimals)}.
- GET /api/sessions: owner's summaries newest first, computed with an aggregation ($size, $avg) — no readings array.
- GET /api/sessions/{id}: summary + readings [{position, score, created_at}].
All ids via parse_object_id; all dates via iso().
tests/test_sessions.py: the flow above, 409 after end, 422 for score 1.5 and position -1, 404 for another user on every route, start on another user's content -> 404, list without readings.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T14"), push the branch and open a PR. Do not merge.
```

## T15 – API פרופיל: שם, סיסמה, מחיקת חשבון (בונוס)
- **אחראי:** A · **תלוי ב:** T12 · **ענף:** `feat/T15-profile-api`

**הסבר מראש הצוות:** עד 6 נקודות בונוס במעט עבודה. החלפת סיסמה מעלה את `token_version`, ולכן כל הטוקנים הישנים (גם במכשירים אחרים) מפסיקים לעבוד. מחיקת חשבון חייבת למחוק גם תוכן, סשנים וניסיונות התחברות – הבודק יוודא.

**הגדרת סיום:**
- [ ] סיסמה נוכחית שגויה → 400; אחרי החלפה הטוקן הישן → 401
- [ ] אחרי מחיקה: התחברות נכשלת ואין מסמכים עם ה-`owner_id` הזה

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
```bash
reg dan@test.com >/dev/null; D=$(tok dan@test.com); D2=$(tok dan@test.com)   # two "devices"
call PATCH /api/users/me "$D" '{"display_name":"  Dan Cohen  "}'            # 200 display_name "Dan Cohen"
call PATCH /api/users/me "$D" '{"display_name":"   "}'                      # 422
call POST /api/users/me/password "$D" '{"current_password":"Wrong1234","new_password":"NewPassw0rd9"}'   # 400 Current password is incorrect
call POST /api/users/me/password "$D" '{"current_password":"Passw0rd123","new_password":"short1"}'       # 422
call POST /api/users/me/password "$D" '{"current_password":"Passw0rd123","new_password":"NewPassw0rd9"}' # 204
call GET /api/users/me "$D" | tail -1; call GET /api/users/me "$D2" | tail -1                          # 401 401
lg dan@test.com | tail -1                                                    # 401 – old password (also adds a login_attempt)
D=$(tok dan@test.com NewPassw0rd9); DID=$(call GET /api/users/me "$D" | jid)
C=$(call POST /api/content "$D" '{"title":"x","type":"youtube","source":"https://youtu.be/dQw4w9WgXcQ"}' | jid)
call POST /api/sessions "$D" "{\"content_id\":\"$C\"}" >/dev/null
call DELETE /api/users/me "$D"                                               # 204
lg dan@test.com NewPassw0rd9 | tail -1                                       # 401
mq "db.users.countDocuments({email_lower:'dan@test.com'})"                   # 0
mq "db.content.countDocuments({owner_id:{\$in:['$DID', ObjectId('$DID')]}})" # 0
mq "db.sessions.countDocuments({owner_id:{\$in:['$DID', ObjectId('$DID')]}})" # 0
mq "db.login_attempts.countDocuments({email_lower:'dan@test.com'})"          # 0
A=$(tok alice@test.com); call GET /api/content "$A"                          # other users' data untouched
```
- [ ] pytest ירוק

**פרומפט:**
```
Task T15: profile API. Follow GIT_WORKFLOW.md: create branch feat/T15-profile-api from an up-to-date main before changing anything.

In app/routers/users.py (auth on all):
- PATCH /api/users/me {display_name stripped 1-50} -> 200 UserOut.
- POST /api/users/me/password {current_password, new_password}: wrong current -> 400 {"message":"Current password is incorrect"}; validate_password_strength(new); update hash and $inc token_version; 204.
- DELETE /api/users/me: delete sessions, content, login_attempts (by email_lower) and the user; 204.
Tests: rename; wrong current 400; old token 401 after password change; login with the new password works; after delete login fails and no content/sessions remain for that owner_id.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T15"), push the branch and open a PR. Do not merge.
```

---

# חלק 3: לקוח – מפתח B

## T16 – פרויקט React, RTL ועיצוב בסיס
- **אחראי:** B · **תלוי ב:** T02 · **ענף:** `feat/T16-frontend-scaffold`

**הסבר מראש הצוות:** הבודק הוא סוכן AI שקורא את המסך, אז קריאות חשובה כמו פונקציונליות: עברית מימין לשמאל, ניגודיות טובה, כפתורים עם טקסט. `config.js` הוא הטריק שמאפשר לאותה תמונה לעבוד מקומית ובענן: מקומית `API_URL` מצביע ל-`localhost:8000`, ובענן הוא ריק (פנייה לאותו דומיין). לכן חובה `??` ולא `||` – מחרוזת ריקה היא ערך תקין.

**הגדרת סיום:**
- [ ] `npm run dev` → דף בעברית, מימין לשמאל
- [ ] בקונסול: `window.__APP_CONFIG__` קיים; שינוי ל-`""` גורם ל-`API_URL` להיות ריק

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
```bash
cd frontend && npm ci && npm run dev          # http://localhost:5173
```
- [ ] הדף מציג "FocusFlow", הטקסט מיושר לימין, ושם הלשונית "FocusFlow – מדידת ריכוז"
- [ ] בקונסול: `document.documentElement.dir` → `"rtl"`; `document.documentElement.lang` → `"he"`; `window.__APP_CONFIG__` → `{API_URL: "http://localhost:8000"}`
- [ ] `grep -n "||" src/config.js` → אין פלט (רק `??` / `!== undefined`). הבדיקה עם ערך ריק נעשית ב-T20 (`docker run -e API_URL=`)
- [ ] `npm run build` עובר; `grep -c 'src="/config.js"' dist/index.html` → 1, והוא לפני סקריפט האפליקציה
- [ ] Tab במקלדת → מסגרת פוקוס נראית על כל רכיב
- [ ] `grep CORS_ORIGINS ../.env.example` → כולל `http://localhost:5173`
- [ ] `git status` – אין `node_modules/` ו-`dist/`; `package-lock.json` כן נכנס

**פרומפט:**
```
Task T16: frontend scaffold. Follow GIT_WORKFLOW.md: create branch feat/T16-frontend-scaffold from an up-to-date main before changing anything.

In frontend/ (keep public/models/ as is):
- Vite + React (JavaScript), react-router-dom.
- index.html: <html lang="he" dir="rtl">, title "FocusFlow – מדידת ריכוז", <script src="/config.js"></script> before the app script.
- public/config.js: window.__APP_CONFIG__ = { API_URL: "http://localhost:8000" };
- src/config.js: const w = window.__APP_CONFIG__?.API_URL; export const API_URL = (w !== undefined ? w : (import.meta.env.VITE_API_URL ?? "http://localhost:8000")).replace(/\/$/, ""); — comment: empty string means same-origin (cloud).
- src/styles.css: CSS variables for colors (text #1a1a1a, background #fafafa, primary #1d4ed8, danger #b91c1c, warning #b45309, success #15803d), system font, 16px base, line-height 1.6, max-width 1100px container, visible :focus-visible outlines, .btn/.btn-primary/.btn-danger (min-height 44px), .field (label above input), .error (red, under the field), .notice and .notice-success, .card.
- .env.example: set CORS_ORIGINS=http://localhost:3000,http://localhost:5173 so `npm run dev` (port 5173) can call the backend.
- Minimal App.jsx that renders "FocusFlow" so the build works.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T16"), push the branch and open a PR. Do not merge.
```

## T17 – לקוח API, התחברות גלובלית וניווט
- **אחראי:** B · **תלוי ב:** T16 (ו-T12 ממוזג כדי לבדוק מול שרת) · **ענף:** `feat/T17-api-client-auth`

**הסבר מראש הצוות:** כל קריאה לשרת עוברת דרך `client.js` – כך יש מקום אחד לטוקן, לשגיאות ול-401. הדרישה "רענון הדף לא מנתק" מתקיימת כי בטעינה בודקים את הטוקן מול `/api/users/me`. סרגל הניווט חייב להציג שם תצוגה, קישורים לספרייה והיסטוריה, וכפתור התנתקות – הבודק מחפש אותם.

**הגדרת סיום:**
- [ ] נתיב מוגן בלי התחברות → מעבר ל-`/login`
- [ ] אחרי התחברות ורענון – עדיין מחובר
- [ ] נתיב לא קיים → "הדף לא נמצא"

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
```bash
# update the local .env from the new .env.example (CORS 5173), then:
docker compose -f docker-compose.dev.yml up -d --build
cd frontend && npm run dev
A=$(tok alice@test.com); echo "$A"            # token for the manual login below
```
- [ ] מנותקים: `/library`, `/history`, `/profile`, `/content/x` → מעבר ל-`/login`
- [ ] "התחברות" ידנית (עד T18) בקונסול: `localStorage.setItem("ff_token","<A>"); localStorage.setItem("ff_expires_at", String(Date.now()+3600e3))` ורענון → בסרגל: "שלום, Tester", "הספרייה שלי", "היסטוריה", "פרופיל", "התנתקות"; הקישור הפעיל מודגש
- [ ] F5 בכל דף מוגן → נשארים מחוברים (Network: `/api/users/me` → 200)
- [ ] `ff_expires_at` בעבר → בטעינה הטוקן נמחק ועוברים ל-`/login`
- [ ] `ff_token` = `garbage` → מעבר ל-`/login?expired=1` והטוקן נמחק
- [ ] "התנתקות" → `/login`, ה-localStorage ריק, ו-`call GET /api/users/me "$A"` → 401 (השרת ביטל את הטוקן)
- [ ] `/nothing-here` → "הדף לא נמצא" + "חזרה לספרייה"
- [ ] שרת כבוי (`docker compose -f docker-compose.dev.yml stop backend`) ורענון → אין מסך לבן ואין שגיאה לא מטופלת בקונסול
- [ ] `grep -rn "fetch(" src | grep -v "src/api/client.js"` → אין פלט

**פרומפט:**
```
Task T17: API client, auth context and routing. Follow GIT_WORKFLOW.md: create branch feat/T17-api-client-auth from an up-to-date main before changing anything.

- src/api/client.js: apiFetch(path, {method="GET", body}) -> fetch(API_URL + path) with JSON headers and Authorization: Bearer <token> from localStorage "ff_token". 204 -> null. Non-2xx: parse {message}; if 401 and path is not /api/auth/login -> clear token + "ff_expires_at", window.location.assign("/login?expired=1"). Throw Error with .status and .message. Network error -> Error("השרת לא זמין כרגע. נסו שוב בעוד רגע."). Exported helpers: register, login (stores token and expires_at = now + expires_in*1000), logout, getMe, updateMe, changePassword, deleteMe, listContent, getContent, createContent, deleteContent, startSession, postReading, endSession, listSessions, getSession.
- src/auth/AuthContext.jsx: {user, loading, login, logout, refreshUser}. On start: if token exists and not expired -> getMe; else clear.
- src/auth/ProtectedRoute.jsx: while loading show "טוען..."; not logged in -> <Navigate to="/login">.
- src/components/Layout.jsx: header (only when logged in) with links "הספרייה שלי" (/library), "היסטוריה" (/history), "פרופיל" (/profile), text "שלום, {display_name}", button "התנתקות" (API logout, clear, navigate /login). Highlight the active link.
- App.jsx routes: /register, /login (public); /library, /content/:id, /history, /history/:id, /profile (protected, placeholder pages with headings for now); / -> /library; * -> NotFound ("הדף לא נמצא" + link "חזרה לספרייה").

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T17"), push the branch and open a PR. Do not merge.
```

## T18 – מסכי הרשמה והתחברות
- **אחראי:** B · **תלוי ב:** T17, T11 · **ענף:** `feat/T18-auth-pages`

**הסבר מראש הצוות:** 20 נקודות שתלויות כמעט רק בבהירות. כל שדה עם `<label>` אמיתי, הודעת שגיאה ליד השדה הבעייתי, כפתור שמראה שהוא "עובד". אחרי הרשמה עוברים להתחברות עם הודעת הצלחה – כמו שהמטלה מתארת.

**הגדרת סיום:**
- [ ] אימייל קיים → הודעה מתחת לשדה האימייל
- [ ] סיסמה של 5 תווים → הודעה עוד לפני שליחה
- [ ] סיסמה שגויה בהתחברות → "אימייל או סיסמה שגויים"; נכונה → ספרייה, השם למעלה

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
- [ ] `/register`: לחיצה על כל label מעבירה פוקוס לשדה שלו
- [ ] שליחה ריקה → שגיאה מתחת לכל שדה חובה, הפוקוס עובר לשדה השגוי הראשון, ואין בקשה ב-Network
- [ ] סיסמה `abc12` → שגיאה לפני שליחה (אין בקשה ב-Network)
- [ ] הרשמה תקינה עם DevTools → Network → Slow 3G → הכפתור מושבת ומציג "נרשם...", ואז `/login?registered=1` עם "נרשמתם בהצלחה, אפשר להתחבר"
- [ ] אותו אימייל באותיות גדולות → מתחת לאימייל: "האימייל הזה כבר רשום. אפשר להתחבר."
- [ ] סיסמה שמכילה את שם האימייל (`dana12345` ל-`dana@test.com`) → הודעת השרת מתחת לסיסמה
- [ ] `/login` עם סיסמה שגויה → "אימייל או סיסמה שגויים" (role="alert"); אחרי 5 כישלונות → הודעת ה-429 מהשרת
- [ ] התחברות נכונה → `/library` והשם בסרגל; כניסה ל-`/login` כשמחוברים → `/library`
- [ ] `/login?expired=1` → "פג תוקף ההתחברות, התחברו שוב"
- [ ] הזרימה כולה עובדת במקלדת בלבד (Tab / Enter)
- [ ] הקישורים "כבר רשומים? להתחברות" ו-"אין לכם חשבון? הרשמה" עובדים
- [ ] התנתקות ואז "אחורה" בדפדפן → לא חוזרים לספרייה

**פרומפט:**
```
Task T18: register and login pages. Follow GIT_WORKFLOW.md: create branch feat/T18-auth-pages from an up-to-date main before changing anything.

src/pages/Register.jsx: heading "הרשמה"; fields with <label htmlFor>: "אימייל" (type email, autocomplete email), "סיסמה" (type password, autocomplete new-password, hint "לפחות 8 תווים, כולל אות וספרה"), "שם תצוגה". Client checks: required fields, password length >= 8 with a letter and a digit — show errors under the field. Button "הרשמה" (disabled + "נרשם..." while sending). Server errors: 409 -> under email "האימייל הזה כבר רשום. אפשר להתחבר."; 422 -> show server message under the most relevant field (password if it mentions password). Success -> navigate("/login?registered=1"). Link "כבר רשומים? להתחברות".
src/pages/Login.jsx: heading "התחברות"; banners for ?registered=1 ("נרשמתם בהצלחה, אפשר להתחבר") and ?expired=1 ("פג תוקף ההתחברות, התחברו שוב"); fields "אימייל", "סיסמה"; button "כניסה" with loading text "מתחבר..."; 401 -> "אימייל או סיסמה שגויים"; 429 -> server message; success -> /library. Link "אין לכם חשבון? הרשמה". If already logged in, redirect to /library.
Use role="alert" for error banners. Focus the first invalid field on error.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T18"), push the branch and open a PR. Do not merge.
```

## T19 – מסך הספרייה
- **אחראי:** B · **תלוי ב:** T18, T13 · **ענף:** `feat/T19-library-page`

**הסבר מראש הצוות:** כאן הבודק מוסיף את תוכן הדוגמה שלנו מ-PROJECT_INFO, אז הטופס חייב להיות מובן מאליו. דרישות שקל לשכוח: הודעה כשהספרייה ריקה, ואישור לפני מחיקה. כל טקסט של משתמש מוצג כטקסט רגיל (React מגן מ-XSS כברירת מחדל – לא לעקוף).

**הגדרת סיום:**
- [ ] משתמש חדש רואה "הספרייה ריקה..."
- [ ] קישור YouTube תקין נוסף ומופיע עם תמונה; שגוי → הודעה
- [ ] מחיקה רק אחרי אישור

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
- [ ] משתמש חדש → "טוען את הספרייה..." ואז "הספרייה ריקה. הוסיפו סרטון או טקסט כדי להתחיל."
- [ ] הוספת `https://www.youtube.com/watch?v=dQw4w9WgXcQ` → "מוסיף...", "הפריט נוסף לספרייה", הטופס מתאפס, ומופיע כרטיס עם תמונה, "סרטון" ותאריך בעברית
- [ ] גם `https://youtu.be/...` ו-`/shorts/...` מתקבלים
- [ ] `https://example.com` → הודעת שגיאה (role="alert"), והערכים נשארים בטופס
- [ ] טקסט: מונה התווים מתעדכן; פחות מ-20 תווים → שגיאה; טקסט ארוך → כרטיס עם 120 התווים הראשונים
- [ ] כותרת `<img src=x onerror=alert(1)>` → מוצגת כטקסט, ואין חלון alert
- [ ] "פתיחה וצפייה" → `/content/<id>`
- [ ] "מחיקה" → חלון אישור עם שם הפריט; "ביטול" → לא נמחק; "אישור" → הכרטיס נעלם + "הפריט נמחק"; אחרי רענון עדיין לא קיים
- [ ] שרת כבוי ורענון → הודעת שגיאה עם "נסו שוב"; מדליקים את השרת ולוחצים → הספרייה נטענת
- [ ] משתמש שני רואה ספרייה ריקה
- [ ] `grep -rn dangerouslySetInnerHTML frontend/src` → אין פלט

**פרומפט:**
```
Task T19: library page. Follow GIT_WORKFLOW.md: create branch feat/T19-library-page from an up-to-date main before changing anything.

src/pages/Library.jsx:
- heading "הספרייה שלי".
- Card "הוספת פריט": field "כותרת"; radio group "סוג התוכן": "סרטון YouTube" / "טקסט לקריאה"; YouTube -> field "קישור לסרטון" (placeholder https://www.youtube.com/watch?v=...); text -> textarea "הטקסט" (min 20 chars, shows character count). Button "הוספה לספרייה" with loading "מוסיף..."; success notice "הפריט נוסף לספרייה" and the form resets; server error shown under the form (role="alert").
- Loading state "טוען את הספרייה..."; error state with a "נסו שוב" button.
- Empty state: "הספרייה ריקה. הוסיפו סרטון או טקסט כדי להתחיל."
- Grid of cards: thumbnail https://img.youtube.com/vi/{video_id}/mqdefault.jpg (alt = title) or a text icon block with the first 120 chars of the text; title; type label ("סרטון" / "טקסט"); created date (he-IL); buttons "פתיחה וצפייה" (Link to /content/:id) and "מחיקה" -> window.confirm("למחוק את \"{title}\"? הפעולה לא ניתנת לביטול") -> delete -> remove from list + notice "הפריט נמחק".
All user text rendered as plain text.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T19"), push the branch and open a PR. Do not merge.
```

## T20 – Dockerfile ללקוח (nginx) והשלמת Compose
- **אחראי:** B (A עוזר) · **תלוי ב:** T16 · **ענף:** `infra/T20-frontend-docker`

**הסבר מראש הצוות:** התמונה הזו רצה גם אצל הבודק וגם ב-Cloud Run. שלושה דברים חובה: (1) כל נתיב מחזיר `index.html`, אחרת רענון ב-`/library` נותן 404; (2) סוג MIME נכון ל-`.wasm`, אחרת המודל לא נטען; (3) סקריפט הפעלה שכותב `config.js` ממשתנה `API_URL`, עם `${API_URL-...}` (בלי נקודתיים) – כך ערך ריק נשאר ריק בענן.

**הגדרת סיום:**
- [ ] `docker compose -f docker-compose.dev.yml up --build` → `localhost:3000` עובד, רענון ב-`/library` עובד
- [ ] `curl localhost:3000/config.js` מציג את ה-`API_URL` מה-`.env`
- [ ] `docker run -e API_URL= ...` → `config.js` עם מחרוזת ריקה

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
```bash
docker compose -f docker-compose.dev.yml up --build -d && docker compose -f docker-compose.dev.yml ps   # 3 services up
curl -s localhost:3000/config.js                                       # API_URL: "http://localhost:8000"
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" localhost:3000/library   # 200 text/html (SPA fallback)
curl -sI localhost:3000/ | grep -iE "content-security-policy|x-content-type-options|referrer-policy|permissions-policy"   # 4 lines
curl -sI localhost:3000/config.js | grep -i cache-control              # no-cache
ASSET=$(curl -s localhost:3000/ | grep -o '/assets/[^"]*\.js' | head -1); curl -sI localhost:3000$ASSET | grep -i cache-control   # max-age=31536000, immutable
docker build -t ff-frontend-test ./frontend
docker run --rm -d -p 3001:3000 -e API_URL= --name fft ff-frontend-test && sleep 2 && curl -s localhost:3001/config.js   # API_URL: ""
docker rm -f fft
docker run --rm -d -p 3001:3000 --name fft ff-frontend-test && sleep 2 && curl -s localhost:3001/config.js              # API_URL: "http://localhost:8000"
docker rm -f fft
```
- [ ] בדפדפן ב-`localhost:3000`: הרשמה, התחברות וספרייה עובדות; F5 ב-`/library` עובד; אין שגיאות CSP בקונסול
- [ ] אחרי T23: `curl -sI localhost:3000/ort/<file>.wasm | grep -i content-type` → `application/wasm`
- [ ] אחרי T27: הנגן, התמונות הממוזערות והמודל נטענים בלי שגיאות CSP

**פרומפט:**
```
Task T20: frontend Docker image. Follow GIT_WORKFLOW.md: create branch infra/T20-frontend-docker from an up-to-date main before changing anything.

- frontend/Dockerfile multi-stage: node:20-alpine (npm ci, npm run build) -> nginx:alpine; copy dist to /usr/share/nginx/html; copy nginx.conf to /etc/nginx/conf.d/default.conf; copy docker-entrypoint.sh to /docker-entrypoint.d/40-app-config.sh (chmod +x). EXPOSE 3000.
- frontend/nginx.conf: listen 3000; root /usr/share/nginx/html; location / { try_files $uri /index.html; }; types for application/wasm wasm and text/javascript mjs; Cache-Control: /assets/ 1 year immutable, index.html and config.js no-cache; headers X-Content-Type-Options nosniff, Referrer-Policy no-referrer, Permissions-Policy camera=(self); Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://www.youtube.com https://s.ytimg.com; connect-src 'self' http://localhost:8000 blob:; img-src 'self' data: blob: https://img.youtube.com https://i.ytimg.com; frame-src https://www.youtube.com https://www.youtube-nocookie.com; media-src 'self' blob:; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'.
- frontend/docker-entrypoint.sh (#!/bin/sh): writes /usr/share/nginx/html/config.js as window.__APP_CONFIG__ = { API_URL: "${API_URL-http://localhost:8000}" }; — note: "-" without ":" keeps an empty value empty (cloud).
- frontend/.dockerignore: node_modules, dist.
- docker-compose.dev.yml: add frontend: build ./frontend, ports "3000:3000", environment API_URL: ${API_URL}, depends_on backend.
Verify the CSP does not block YouTube iframe, model loading, or API calls by opening the app and checking the console.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T20"), push the branch and open a PR. Do not merge.
```

## T21 – היסטוריה ופרטי סשן
- **אחראי:** B · **תלוי ב:** T27 · **ענף:** `feat/T21-history-pages`

**הסבר מראש הצוות:** הבודק מסיים סשן ומחפש אותו בהיסטוריה עם ציון ממוצע. גרף פשוט של הציון לאורך הסרטון הוא גם הכנה לבונוס האנליטיקה. סשן של משתמש אחר → "הסשן לא נמצא" בלבד.

**הגדרת סיום:**
- [ ] סשן שהסתיים מופיע עם תאריך, שם תוכן וממוצע
- [ ] לחיצה מציגה גרף וטבלת מדידות

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
מכינים נתונים עם הפקודות של T14 (או דרך מסך הצפייה): סשן שהסתיים עם 0.2/0.6/1.0, סשן פתוח, סשן שהסתיים בלי מדידות, וסשן על פריט טקסט.
- [ ] `/history` למשתמש חדש → "עדיין אין סשנים. פתחו פריט מהספרייה והתחילו סשן."
- [ ] הסשן עם 0.2/0.6/1.0: תאריך ושעה בעברית, שם התוכן, משך mm:ss, "3", "0.60 קשב חלקי"
- [ ] סשן פתוח → "לא הסתיים"; סשן בלי מדידות → "אין מדידות"
- [ ] גבולות `scoreLevel` (סשנים עם מדידה אחת): 0.7 / 0.69 / 0.4 / 0.39 → "קשוב" / "קשב חלקי" / "קשב חלקי" / "קשב נמוך"
- [ ] "פרטים" → כרטיס סיכום (שם התוכן מקשר ל-`/content/<id>`), גרף עם 3 נקודות, קו מקווקו ב-0.4 עם "סף קשב נמוך", וצירים עם תוויות; טבלה "מיקום", "ציון", "זמן"
- [ ] בסרטון המיקום בפורמט mm:ss, ובטקסט באחוזים
- [ ] `/history/<id של סשן של משתמש אחר>` ו-`/history/abc` → רק "הסשן לא נמצא" + קישור חזרה

**פרומפט:**
```
Task T21: history pages. Follow GIT_WORKFLOW.md: create branch feat/T21-history-pages from an up-to-date main before changing anything.

src/pages/History.jsx (/history): heading "היסטוריית סשנים"; empty state "עדיין אין סשנים. פתחו פריט מהספרייה והתחילו סשן."; table with columns "תאריך" (he-IL date+time), "תוכן", "משך" (mm:ss from started_at..ended_at, or "לא הסתיים"), "מדידות", "ציון ממוצע" (2 decimals + word: >=0.7 "קשוב", 0.4-0.7 "קשב חלקי", <0.4 "קשב נמוך", null -> "אין מדידות"), and a link "פרטים" -> /history/:id.
src/components/ScoreLevel.js: shared function scoreLevel(score) -> {label, colorVar} used here and in the watch page.
src/pages/SessionDetail.jsx (/history/:id): 404 -> only "הסשן לא נמצא" + link back. Summary card (content title linking to /content/:content_id, start, end, reading count, average). Inline SVG line chart: x = position (seconds as mm:ss for youtube, % for text), y = 0..1, dashed horizontal line at 0.4 labeled "סף קשב נמוך", axis labels. Below: table "מיקום", "ציון", "זמן".
Need the content type for formatting: fetch getContent(content_id) and fall back to seconds if it fails.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T21"), push the branch and open a PR. Do not merge.
```

## T22 – מסך פרופיל (בונוס)
- **אחראי:** B · **תלוי ב:** T15, T17 · **ענף:** `feat/T22-profile-page`

**הסבר מראש הצוות:** המטלה דורשת "אישור מפורש לפני מחיקת החשבון". הקלדת המילה "מחיקה" + חלון אישור זה מפורש מספיק. אחרי החלפת סיסמה השרת מבטל את הטוקן, לכן הלקוח מנתק ומבקש להתחבר מחדש.

**הגדרת סיום:**
- [ ] שם חדש מופיע מיד בסרגל העליון
- [ ] החלפת סיסמה → הודעה ומעבר להתחברות
- [ ] מחיקה דורשת הקלדה + אישור, ואחריה אי אפשר להתחבר

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
- [ ] `/profile`: האימייל (לקריאה בלבד) ו-"חבר מאז {תאריך}"
- [ ] שינוי שם → "השם עודכן", השם בסרגל מתעדכן מיד בלי רענון, ונשמר אחרי F5; שם ריק → שגיאה
- [ ] החלפת סיסמה: אימות שלא תואם → שגיאה בלי בקשה; סיסמה חלשה → שגיאה; סיסמה נוכחית שגויה → "הסיסמה הנוכחית שגויה"
- [ ] החלפה תקינה → `/login?pwchanged=1` עם "הסיסמה הוחלפה. התחברו עם הסיסמה החדשה"; הסיסמה הישנה נכשלת והחדשה עובדת
- [ ] לשונית שנייה שהייתה מחוברת לפני ההחלפה → בפעולה הבאה מעבר ל-`/login?expired=1`
- [ ] מחיקה: הכפתור מושבת עד שמקלידים בדיוק "מחיקה"; "ביטול" בחלון האישור → לא נמחק; "אישור" → `/register?deleted=1` עם "החשבון נמחק"
- [ ] אחרי מחיקה ההתחברות נכשלת, ובמסד אין תוכן/סשנים של המשתמש (פקודות `mq` מ-T15)

**פרומפט:**
```
Task T22: profile page. Follow GIT_WORKFLOW.md: create branch feat/T22-profile-page from an up-to-date main before changing anything.

src/pages/Profile.jsx (/profile): heading "הפרופיל שלי"; read-only email and "חבר מאז {date}".
- Form "שינוי שם תצוגה" (prefilled) -> updateMe -> refreshUser() so the header updates -> notice "השם עודכן".
- Form "החלפת סיסמה": "סיסמה נוכחית", "סיסמה חדשה", "אימות סיסמה חדשה" (must match, same strength rules as register). 400 -> under current password "הסיסמה הנוכחית שגויה". Success -> clear token -> /login with a notice "הסיסמה הוחלפה. התחברו עם הסיסמה החדשה" (pass via query ?pwchanged=1 and show it in Login).
- Danger zone (red border) "מחיקת חשבון": explains everything will be deleted (content, sessions, history); input "הקלידו מחיקה לאישור"; red button "מחיקת החשבון וכל הנתונים" enabled only when the input equals "מחיקה"; then window.confirm; success -> clear token -> /register?deleted=1 with notice "החשבון נמחק".

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T22"), push the branch and open a PR. Do not merge.
```

---

# חלק 4: מצלמה ומודל – מפתח C

## T23 – MediaPipe ו-ONNX בדפדפן
- **אחראי:** C · **תלוי ב:** T16 · **ענף:** `feat/T23-face-and-model`

**הסבר מראש הצוות:** שני הרכיבים הכבדים של הפרויקט. חשוב: כל קבצי ה-WASM והמודלים יושבים בתוך התמונה – המטלה אוסרת להוריד אותם בזמן ריצה, והבודק אולי בלי אינטרנט מהיר. שולחים ל-MediaPipe את הנקודות הגולמיות בלי נרמול (המודל מנרמל לבד), ומספר הנקודות חייב להיות בדיוק 478. `numThreads = 1` חוסך כותרות COOP/COEP שהיו שוברות את נגן YouTube.

**הגדרת סיום:**
- [ ] אחרי `npm run build`, בתיקיית `dist` יש `mediapipe/wasm/`, `ort/`, `models/`
- [ ] בקונסול (dev) מודפסים `inputNames`/`outputNames` של המודל

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
```bash
ls -la frontend/public/models                                   # v4_2.onnx and face_landmarker.task (from T00)
cd frontend && npm run build && ls dist/mediapipe/wasm dist/ort dist/models   # all non-empty
grep -rnE "https?://[^\"' ]*(cdn|jsdelivr|unpkg|googleapis|gstatic|storage)" src   # no output – nothing downloaded at runtime
npm run dev
```
בקונסול של `http://localhost:5173`:
```js
const m = await import("/src/attention/attentionModel.js");
await m.loadModel();                                            // console.info prints inputNames / outputNames
(await m.predict(new Float32Array(100 * 478 * 3))).score        // a number between 0 and 1
const f = await import("/src/attention/faceTracker.js");
const t = await f.createFaceTracker(); t.close();               // no error
```
- [ ] Network: `face_landmarker.task`, `v4_2.onnx` וכל קבצי ה-`.wasm`/`.mjs` נטענים מ-localhost בלבד
- [ ] קריאת קוד: אין נרמול נקודות ב-`detect`; יש בדיקה ל-478 נקודות; `numThreads = 1`; `wasmPaths = "/ort/"`
- [ ] `src/attention/README.md` קיים

**פרומפט:**
```
Task T23: face tracker and attention model modules. Follow GIT_WORKFLOW.md: create branch feat/T23-face-and-model from an up-to-date main before changing anything.

- npm install @mediapipe/tasks-vision onnxruntime-web; npm install -D vite-plugin-static-copy.
- vite.config.js: static copy node_modules/@mediapipe/tasks-vision/wasm/* -> mediapipe/wasm and node_modules/onnxruntime-web/dist/*.{wasm,mjs} -> ort. Nothing is downloaded at runtime; public/models/v4_2.onnx and public/models/face_landmarker.task already exist (if not, stop and tell me).
- src/attention/faceTracker.js: createFaceTracker() -> FilesetResolver.forVisionTasks("/mediapipe/wasm"); FaceLandmarker.createFromOptions({baseOptions:{modelAssetPath:"/models/face_landmarker.task", delegate:"GPU"}, runningMode:"VIDEO", numFaces:1}) with a fallback to delegate "CPU" on error. Returns {detect(video, tsMs) -> Float32Array(1434) | null, close()}. detect returns null when no face or landmarks length != 478; otherwise raw x,y,z in landmark order (no normalization).
- src/attention/attentionModel.js: import * as ort; ort.env.wasm.wasmPaths = "/ort/"; ort.env.wasm.numThreads = 1. loadModel(url="/models/v4_2.onnx") singleton. predict(frames Float32Array(100*478*3)) -> {score (clamped 0..1, from outputs[outputNames[0]].data[0]), raw: outputs}. Use session.inputNames[0] as the input name; tensor shape [1,100,478,3]. In dev, console.info input/output names once.
- Add a short src/attention/README.md: data flow, shapes, why numThreads=1, why files are local.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T23"), push the branch and open a PR. Do not merge.
```

## T24 – לולאת המדידה ועמוד ניסוי
- **אחראי:** C · **תלוי ב:** T23 · **ענף:** `feat/T24-attention-loop`

**הסבר מראש הצוות:** זה המוח של המדידה, ושווה 34 נקודות (סשן + חוסר פנים). דוגמים 10 פריימים בשנייה, מחזיקים חלון נע של 100, ומריצים את המודל כל 2 שניות. אם אין פנים יותר משנייה – מציגים "לא זוהו פנים", מנקים את החלון ולא מריצים את המודל (המטלה דורשת). עמוד `/lab` בודק את כל זה בלי שרת. **חובה לבדוק עם OBS Virtual Camera** – זה מה שהבודק משתמש בו.

**הגדרת סיום:**
- [ ] מול המצלמה: ציון ראשון אחרי ~10 שניות, מתעדכן כל 2 שניות
- [ ] יציאה מהפריים: "לא זוהו פנים" תוך שנייה
- [ ] OBS עם סרטון אדם ממוקד → ציון גבוה; סרטון בלי פנים → "לא זוהו פנים"

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
- [ ] `npm run dev` → `/lab` עובד; `npm run build && npm run preview` → `/lab` מציג "הדף לא נמצא" (רק ב-dev)
- [ ] "הפעלת מצלמה" → בקשת הרשאה → תצוגה מקדימה
- [ ] מול המצלמה: `loading` → `collecting` עם התקדמות עד 100% → `measuring`; ציון ראשון אחרי כ-10–12 שניות
- [ ] ציונים בקונסול כל כ-2 שניות (Console → Settings → Show timestamps; הפרש של כ-2000ms)
- [ ] מבט הצידה או בטלפון במשך 20 שניות → הציון יורד (כמגמה, לא בכל מדידה)
- [ ] יציאה מהפריים → `no_face` תוך כשנייה, ואין ציונים חדשים; חזרה → `collecting` מ-0% (החלון התאפס)
- [ ] **OBS:** Sources → Media Source עם סרטון של אדם שמסתכל למצלמה (Loop) → Start Virtual Camera → בוחרים "OBS Virtual Camera" ברשימה → ציון גבוה (רוב הזמן מעל 0.6); סרטון בלי פנים → `no_face`
- [ ] יציאה מ-`/lab` → נורית המצלמה כבויה ואין שגיאות בקונסול
- [ ] DevTools → Performance monitor: ה-CPU יציב לאורך 2 דקות (הקריאות ל-predict לא מצטברות)
- [ ] ציונים מוזרים? לוודא בקונסול shape `[1,100,478,3]`, ולנסות את `v1.onnx`

**פרומפט:**
```
Task T24: attention sampling hook and lab page. Follow GIT_WORKFLOW.md: create branch feat/T24-attention-loop from an up-to-date main before changing anything.

src/attention/useAttention.js: useAttention({videoRef, enabled, onScore}) returns {status: "idle"|"loading"|"collecting"|"no_face"|"measuring"|"error", progress (0..1), lastScore, error}.
- enabled -> status loading -> load tracker + model in parallel -> setInterval 100ms (10 fps).
- Each tick: if video not ready (readyState < 2) skip; detect(video, performance.now()).
- Ring buffer: Float32Array(100*1434) + writeIndex + count.
- No face for 10 consecutive ticks -> status no_face, reset buffer (count=0), do not predict. Face back -> collecting.
- count < 100 -> status collecting, progress = count/100.
- count == 100 -> every 20 ticks run predict on the window copied in chronological order (oldest first); a "busy" flag prevents overlapping runs; status measuring; set lastScore; call onScore(score, raw).
- Cleanup on disable/unmount: clear interval, close tracker. Catch errors -> status error with a Hebrew message.
src/pages/Lab.jsx at route /lab only when import.meta.env.DEV: button "הפעלת מצלמה" (getUserMedia), muted playsInline video preview, a <select> of video inputs (enumerateDevices) to switch cameras, and text showing status, progress %, last score (2 decimals), plus console.log of each score.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T24"), push the branch and open a PR. Do not merge.
```

## T25 – רכיבי מצלמה, ציון והתראה
- **אחראי:** C · **תלוי ב:** T24 · **ענף:** `feat/T25-camera-ui`

**הסבר מראש הצוות:** המטלה דורשת: הסבר על מה נאסף לפני הדלקה, אפשרות לסרב ולהמשיך לצפות, הודעה כשאין פנים, ציון בולט עם הסבר, והתראה מתחת ל-0.4. רשימת בחירת המצלמה קריטית לבודק – אצלו OBS אולי לא ברירת המחדל. ההתראה לא צריכה לקפוץ כל 2 שניות – השהיה של 30 שניות אחרי סגירה.

**הגדרת סיום:**
- [ ] סירוב להרשאה → הודעה ברורה, הדף ממשיך לעבוד
- [ ] ציון < 0.4 → באנר עם "חזרה 15 שניות"
- [ ] החלפת מצלמה ברשימה עובדת בלי לרענן

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
- [ ] ב-`/lab`: "הפעלת מצלמה למדידת קשב" → חלון הסבר (role="dialog") עם הטקסט המלא; "לא עכשיו" סוגר והמצלמה לא נדלקת
- [ ] "מסכים/ה – הפעלת מצלמה" → בקשת הרשאה
- [ ] חוסמים את המצלמה (המנעול בשורת הכתובת → Camera → Block) ומנסים → "לא התקבלה גישה למצלמה. אפשר להמשיך לצפות בלי מדידה." והדף ממשיך לעבוד
- [ ] `npm run dev -- --host` ופתיחה מ-`http://<IP של המחשב>:5173/lab` → "המצלמה זמינה רק בחיבור מאובטח (https)"
- [ ] "בחירת מצלמה": מעבר בין מצלמת המחשב ל-OBS בלי רענון; התצוגה המקדימה הפוכה כמו מראה
- [ ] "כיבוי מצלמה" → נורית המצלמה כבויה
- [ ] טקסטי הסטטוס בדיוק כמו בפרומפט (טעינה; איסוף עם `<progress>`; אין פנים בתיבה צהובה עם role="status"; שגיאה)
- [ ] ScoreBadge: לפני ציון "—" + "ממתין לציון ראשון"; אחר כך מספר עם 2 ספרות, מילה, צבע, פס ו-sparkline; `aria-live="polite"` (ב-Elements)
- [ ] LowFocusAlert: מבט הצידה עד ציון מתחת ל-0.4 → באנר; "חזרה 15 שניות" → הודעה בקונסול; "סגירה" → לא חוזר 30 שניות גם כשהציון נמוך
- [ ] תיבת sessionActive כבויה → onScore לא נקרא; דלוקה → נקרא
- [ ] מעבר לדף אחר → המצלמה כבויה

**פרומפט:**
```
Task T25: camera panel, score badge and low-focus alert. Follow GIT_WORKFLOW.md: create branch feat/T25-camera-ui from an up-to-date main before changing anything.

src/components/CameraPanel.jsx props {sessionActive, onScore}:
- Before consent: button "הפעלת מצלמה למדידת קשב". Click -> explanation box (role="dialog"): "המצלמה משמשת רק לחישוב ציון קשב. הווידאו ונקודות הפנים לא נשלחים ולא נשמרים – הם מעובדים במחשב שלכם בלבד. לשרת נשלח רק מספר בין 0 ל-1 כל 2 שניות, יחד עם המיקום בתוכן. אפשר לכבות בכל רגע." Buttons "מסכים/ה – הפעלת מצלמה" and "לא עכשיו".
- getUserMedia({video:{width:640,height:480,deviceId?}}). NotAllowedError/NotFoundError -> "לא התקבלה גישה למצלמה. אפשר להמשיך לצפות בלי מדידה." If navigator.mediaDevices is undefined -> "המצלמה זמינה רק בחיבור מאובטח (https)".
- After access: <select> "בחירת מצלמה" (videoinput labels; switching restarts the stream), small mirrored preview, button "כיבוי מצלמה" (stops all tracks).
- Status lines from useAttention: loading "טוען את מודל הקשב..."; collecting "אוסף נתונים – הציון הראשון יופיע בעוד כ-10 שניות" + <progress>; no_face -> yellow box role="status" "לא זוהו פנים. ודאו שהפנים מול המצלמה ושיש מספיק תאורה."; error -> message.
- Calls onScore only when sessionActive. Stops tracks on unmount.
src/components/ScoreBadge.jsx {score, history}: label "ציון קשב נוכחי"; big number (2 decimals) + scoreLevel word and color; bar width score*100%; caption "0 = לא קשוב, 1 = קשוב מאוד · מתעדכן כל 2 שניות"; before first score "—" + "ממתין לציון ראשון"; inline SVG sparkline of the last 30 scores. aria-live="polite".
src/components/LowFocusAlert.jsx {score, onRewind}: when score < 0.4 show role="alert" banner "נראה שהקשב ירד. רוצים לחזור 15 שניות אחורה או לקחת הפסקה קצרה?" with buttons "חזרה 15 שניות" and "סגירה"; after closing, do not show again for 30 seconds.
Also render CameraPanel (with a checkbox for sessionActive), ScoreBadge and LowFocusAlert (onRewind logs to the console) on the dev-only /lab page, so they can be tested before T27.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T25"), push the branch and open a PR. Do not merge.
```

## T26 – נגן YouTube ותצוגת טקסט
- **אחראי:** C · **תלוי ב:** T23 · **ענף:** `feat/T26-content-viewers`

**הסבר מראש הצוות:** כל מדידה נשמרת עם "מיקום", כדי שבהיסטוריה נדע איפה הקשב ירד. בסרטון – שניות; בטקסט – אחוז גלילה. שני הרכיבים חושפים אותו ממשק (`getPosition`, `seekBy`), כך שמסך הצפייה לא צריך לדעת איזה סוג תוכן מוצג.

**הגדרת סיום:**
- [ ] סרטון נטען ומתנגן; `getPosition()` מחזיר שניות
- [ ] טקסט ארוך נגלל; `getPosition()` מחזיר 0–100

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
- [ ] ב-`/lab`: הסרטון נטען ("טוען את הסרטון..." עד שמוכן) ומתנגן
- [ ] "מיקום נוכחי" בזמן ניגון → שניות עם ספרה אחת אחרי הנקודה, ועולה עם הזמן; לפני שהנגן מוכן → 0
- [ ] "חזרה 15 שניות" ב-0:40 → 0:25; ב-0:05 → 0:00
- [ ] DevTools → Network → Block request domain `www.youtube.com` ורענון → "לא ניתן לטעון את הנגן. בדקו את החיבור לאינטרנט."
- [ ] Network: `iframe_api` נטען פעם אחת בלבד, גם כשעוברים בין דפים
- [ ] טקסט: פסקאות לפי שורות ריקות; גלילה מעדכנת את פס ההתקדמות; "מיקום נוכחי" → 0 למעלה, 100 למטה, וערך ביניים באמצע
- [ ] "חזרה 15 שניות" בטקסט → גלילה למעלה בגובה מסך אחד
- [ ] טקסט עם `<b>תג</b>` מוצג כטקסט
- [ ] ברוחב 375px הנגן נשאר 16:9 ואין גלילה אופקית

**פרומפט:**
```
Task T26: YouTube player and text reader. Follow GIT_WORKFLOW.md: create branch feat/T26-content-viewers from an up-to-date main before changing anything.

src/components/YouTubePlayer.jsx (forwardRef) {videoId}: load https://www.youtube.com/iframe_api once (shared promise), create YT.Player in a 16:9 responsive container (playerVars: rel 0, modestbranding 1). Expose via useImperativeHandle: getPosition() -> Math.round(getCurrentTime()*10)/10 (0 if not ready), seekBy(sec) -> seekTo(max(0, t+sec), true). Show "טוען את הסרטון..." until ready; if the API fails to load show "לא ניתן לטעון את הנגן. בדקו את החיבור לאינטרנט."
src/components/TextReader.jsx (forwardRef) {text}: plain paragraphs (split on blank lines), scrollable panel (max-height 70vh, max-width 70ch, font-size 18px, line-height 1.8), reading progress bar on top. getPosition() -> scroll % 0..100 with 1 decimal; seekBy(sec) -> scroll up by one viewport height when sec < 0.
No dangerouslySetInnerHTML.
Add both to the dev-only /lab page with a sample video and a long sample text, and buttons "מיקום נוכחי" (prints getPosition()) and "חזרה 15 שניות" (seekBy(-15)).

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T26"), push the branch and open a PR. Do not merge.
```

## T27 – מסך הצפייה (חיבור הכל)
- **אחראי:** C ו-B יחד · **תלוי ב:** T14, T19, T25, T26 · **ענף:** `feat/T27-watch-page`

**הסבר מראש הצוות:** כאן כל העבודה מתחברת, וזה מה שהבודק עושה הכי הרבה זמן. מומלץ לעבוד בזוג (pair programming) – אחד כותב והשני בודק במקביל עם OBS. מקרים קשים: יציאה מהדף באמצע סשן (סוגרים את הסשן עם `keepalive`), שגיאת רשת זמנית (לא עוצרים את המדידה), ו-409 (הסשן נסגר – מפסיקים לשלוח). **אחרי המיזוג: פורסים לענן ובודקים את המצלמה בדומיין ב-HTTPS, גם מטלפון.**

**הגדרת סיום:**
- [ ] זרימה מלאה: פריט → התחלת סשן → מצלמה → ציון → "לא זוהו פנים" → סיום → סיכום → היסטוריה
- [ ] `/content/<id של משתמש אחר>` → "הפריט לא נמצא" בלבד
- [ ] אותה זרימה עובדת ב-`https://<domain>`

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
מריצים מקומית עם `docker compose -f docker-compose.dev.yml up --build` (לא רק `npm run dev`), עם DevTools → Network פתוח:
1. [ ] **זרימה מלאה עם YouTube:** ספרייה → "פתיחה וצפייה" → "התחלת סשן" (טיימר רץ) → הסכמה למצלמה → ציון אחרי כ-10 שניות → `POST /api/sessions/<id>/readings` → 201 כל כ-2 שניות, עם `position` שתואם לזמן בסרטון
2. [ ] **אין פנים:** יציאה מהפריים (או OBS עם סרטון בלי פנים) → "לא זוהו פנים", ואין בקשות readings בזמן הזה; חזרה → מדידות חוזרות אחרי כ-10 שניות
3. [ ] **סיום:** "סיום סשן" → המצלמה כבויה → "הסשן הסתיים" עם מספר המדידות והממוצע → "לצפייה בהיסטוריה" → אותם מספרים
4. [ ] בשרת: `call GET /api/sessions/<id> "$A"` → המדידות עם `position` ו-`score`
5. [ ] **טקסט:** אותה זרימה על פריט טקסט; המיקומים באחוזים
6. [ ] **סירוב למצלמה:** התחלה וסיום של סשן עובדים, 0 מדידות, ובהיסטוריה "אין מדידות"
7. [ ] **יציאה באמצע:** לחיצה על "הספרייה שלי" באמצע סשן → ב-Network `POST .../end` (keepalive); בהיסטוריה הסשן הסתיים. סגירת הלשונית באמצע סשן → אחרי פתיחה מחדש הסשן הסתיים
8. [ ] **409:** בזמן שהדף פעיל, `call POST /api/sessions/<id>/end "$A"` → במדידה הבאה "הסשן נסגר" ואין יותר בקשות
9. [ ] **תקלת רשת:** `docker compose -f docker-compose.dev.yml stop backend` ל-10 שניות → "מדידה אחת לא נשמרה" והמדידה ממשיכה; אחרי `start` המדידות נשמרות שוב
10. [ ] **קשב נמוך:** מבט הצידה → באנר → "חזרה 15 שניות" מחזיר את הסרטון אחורה
11. [ ] **הפרדה:** `/content/<id של משתמש אחר>` → רק "הפריט לא נמצא" + "חזרה לספרייה"
12. [ ] חלון צר מ-900px → התוכן מעל הפאנל
13. [ ] **OBS:** סרטון של אדם ממוקד → ציונים גבוהים; סרטון בלי פנים → "לא זוהו פנים". התוצאות מתוארות ב-PR
14. [ ] **ענן (אחרי המיזוג):** `build-and-push.sh` + `deploy.sh`, ואותה זרימה ב-`https://<domain>` – גם מטלפון

**פרומפט:**
```
Task T27: watch page integration. Follow GIT_WORKFLOW.md: create branch feat/T27-watch-page from an up-to-date main before changing anything.

src/pages/Watch.jsx (/content/:id):
- getContent(id): loading "טוען..."; 404 -> only "הפריט לא נמצא" + link "חזרה לספרייה" (no other info).
- Layout: two columns on wide screens (content | side panel), stacked under 900px. Content = YouTubePlayer (videoId) or TextReader (source) with a ref.
- Side panel:
  * Session box: before start -> text "סשן = צפייה אחת בפריט עם מדידת קשב" + button "התחלת סשן". Click -> startSession -> "הסשן פעיל" + elapsed timer mm:ss + button "סיום סשן".
  * CameraPanel (sessionActive, onScore), ScoreBadge, LowFocusAlert (onRewind = playerRef.seekBy(-15)).
- onScore(score): postReading(sessionId, {position: playerRef.current.getPosition(), score}). 409 -> stop sending and show "הסשן נסגר". Other errors -> small non-blocking warning "מדידה אחת לא נשמרה", keep measuring. Keep a local history array for the sparkline.
- "סיום סשן": endSession -> stop camera -> summary card "הסשן הסתיים" with reading_count and average_score (scoreLevel word) and link "לצפייה בהיסטוריה" -> /history/:sessionId, plus button "סשן חדש".
- Leaving the page with an active session: on unmount and on 'pagehide' call fetch(API_URL + /api/sessions/{id}/end, {method:"POST", keepalive:true, headers with Bearer}); always stop the camera.
- If the camera was refused, the page still works (session without readings).
Then run the full flow locally with OBS Virtual Camera (focused person video, then a no-face video) and describe the results in the PR.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T27"), push the branch and open a PR. Do not merge.
```

---

# חלק 5: הגשה – כולם

## T28 – קבצי ההגשה של מטלה 3
- **אחראי:** A · **תלוי ב:** T20, T27 · **ענף:** `infra/T28-submission`

**הסבר מראש הצוות:** הבודק מקבל רק `docker-compose.yml`, `.env` ו-`PROJECT_INFO.docx`, בלי קוד. לכן ה-Compose מושך תמונות מוכנות (`image:` ולא `build:`) בתג קבוע `v1`. ה-`.env` המוגש מכיל `JWT_SECRET` חד-פעמי שנוצר רק בשביל ההגשה, ו-`GEMINI_API_KEY` ריק. בדיקה על מחשב שלא בנה כלום היא חובה. כאן בונים את הסקריפטים ובודקים אותם; את ה-zip הסופי בונים רק ב-T37.

**הגדרת סיום:**
- [ ] תיקייה ריקה עם שני הקבצים → `docker compose up` → האתר עובד מקצה לקצה
- [ ] `unzip -l submission/assignment3.zip` → בדיוק שלושה קבצים בשורש

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
```bash
grep -c "build:" docker-compose.yml                  # 0
grep -E "image:|platform:" docker-compose.yml        # backend/frontend :v1 + linux/amd64; mongo:7
grep -c 27017 docker-compose.yml                     # 0 – Mongo is not published in the submission
docker compose -f docker-compose.yml config -q && echo valid
docker run --rm -v "$PWD:/mnt" -w /mnt koalaman/shellcheck:stable scripts/make-submission.sh scripts/test-clean-run.sh   # no output
TAG=v1 DOCKER_USER=<user> scripts/build-and-push.sh   # first v1 images (rebuilt for real in T37)
docker manifest inspect <user>/focusflow-frontend:v1 | grep architecture   # amd64
cp docs/assignment/PROJECT_INFO_template.docx docs/PROJECT_INFO.docx       # temporary – only to test the zip
scripts/make-submission.sh                           # unzip -l: exactly docker-compose.yml, .env, PROJECT_INFO.docx at the top level
grep JWT_SECRET submission/.env                      # long random value, different from your .env
scripts/make-submission.sh >/dev/null && grep JWT_SECRET submission/.env   # a new value on every run
git status --short submission docs                   # submission/.env and the zip are ignored
rm docs/PROJECT_INFO.docx
scripts/test-clean-run.sh                            # OK for :8000/health and :3000
```
- [ ] במחשב של חבר צוות שלא בנה כלום: `docker image rm <user>/focusflow-backend:v1 <user>/focusflow-frontend:v1` (אם קיימות), ואז בתיקייה ריקה רק `docker-compose.yml` ו-`.env` → `docker compose up` → האתר עובד מקצה לקצה
- [ ] `docker compose down` (בלי `-v`) ושוב `up` → המשתמש והתוכן עדיין קיימים

**פרומפט:**
```
Task T28: assignment 3 submission files. Follow GIT_WORKFLOW.md: create branch infra/T28-submission from an up-to-date main before changing anything.

- docker-compose.yml (repo root, the submitted one): same as docker-compose.dev.yml (but without publishing the 27017 port) and backend/frontend use image: ${DOCKER_USER}/focusflow-<name>:v1 written as literal names (ask me for the Docker Hub username), platform: linux/amd64, no build:, no bind mounts, env_file .env, restart: unless-stopped, healthchecks, depends_on service_healthy, mongo:7 with named volume mongo_data.
- submission/.env.template: copy of .env.example with a comment line "# JWT_SECRET is a one-time random value for local grading only".
- scripts/make-submission.sh: generates submission/.env from the template with a fresh JWT_SECRET (python3 secrets.token_urlsafe(48)), checks that docs/PROJECT_INFO.docx exists, then creates submission/assignment3.zip with docker-compose.yml, .env and PROJECT_INFO.docx at the top level (zip -j), adds extension/ only if it exists, and prints unzip -l. submission/.env and the zip are gitignored.
- scripts/test-clean-run.sh: copies docker-compose.yml and submission/.env to a temp dir, runs docker compose down -v, up -d, waits for http://localhost:8000/health and http://localhost:3000, prints OK/FAIL, and tears down only if asked.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T28"), push the branch and open a PR. Do not merge.
```

## T29 – בדיקת קבלה מלאה ו-PROJECT_INFO
- **אחראי:** B ו-C בודקים, כולם ממלאים · **תלוי ב:** T28 · **ענף:** `docs/T29-acceptance-and-info`

**הסבר מראש הצוות:** כל אחד עובר על האתר כאילו הוא הבודק: חלון בסתר, משתמש חדש, OBS. מי שלא כתב חלק – בודק אותו (עיניים טריות מוצאות יותר). כל תקלה = Issue ב-GitHub + ענף `fix/...`. את PROJECT_INFO ממלאים לפי מה שבאמת עובד – מה שכתוב בו נבדק, וכנות מוערכת. סעיף האבטחה הוא בונוס: שמות ספריות, אלגוריתמים וערכים.

**הגדרת סיום:**
- [ ] כל עשר שורות הצ'קליסט במסמך התכנון ירוקות – מקומית ובענן
- [ ] `docs/PROJECT_INFO.docx` מלא, בלי סודות, כל שדה עם תשובה או `none`

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
```bash
for f in project_name authors one_sentence_description main_content_type what_is_a_content_item sample_content_type \
  sample_content_for_testing interface_language backend_framework frontend_framework database what_is_measured models_used \
  model_highlights changes_to_recommended_api how_to_register what_is_a_session how_to_start_a_session camera_notes \
  where_the_score_appears seconds_until_first_score low_focus_reaction how_to_end_a_session run_command setup_notes \
  password_storage password_rules token_handling access_control data_isolation input_validation camera_and_face_data \
  secrets_handling extra_account_security works_fully partially_works_or_missing known_issues plugin extra_features \
  what_makes_it_yours; do grep -q "$f" docs/PROJECT_INFO_draft.md || echo "MISSING $f"; done   # no output
grep -n TODO docs/PROJECT_INFO_draft.md               # only fields only humans know (must be 0 before T37)
grep -n "rounds=12" backend/app/security.py; grep -n HS256 backend/app/security.py; grep -n 900 backend/app/db.py   # match the security answers
grep -oE '"[^"]+"' docs/PROJECT_INFO_draft.md | sort -u   # every button name here must exist: grep -rn "<name>" frontend/src
unzip -p docs/PROJECT_INFO.docx word/document.xml | grep -cE "mongodb\+srv|AIza|JWT_SECRET="   # 0 (after the manual docx step)
```
- [ ] `docs/ACCEPTANCE.md`: 10 שורות הציון (סכום 100) + שורות הענן; לכל אחת צעדים ותוצאה צפויה, ועמודות Local / Cloud
- [ ] כל חבר צוות עבר על ACCEPTANCE מקומית בחלון בסתר, עם משתמש חדש ו-OBS, ומילא את Local; כל כישלון → Issue עם תבנית bug ותווית `acceptance` → T36
- [ ] ב-PROJECT_INFO.docx מספר השורות ושמות השדות זהים לתבנית שב-`docs/assignment/`; לכל שדה יש תשובה או `none`
- [ ] `sample_content_for_testing` הוא קישור שנבדק ממחשב אחר, ושבעליו מאפשרים להטמיע אותו (הנגן לא מציג "Video unavailable")

**פרומפט:**
```
Task T29: acceptance test notes and PROJECT_INFO draft. Follow GIT_WORKFLOW.md: create branch docs/T29-acceptance-and-info from an up-to-date main before changing anything.

1. Create docs/ACCEPTANCE.md: a checklist mirroring the grading table (startup 10, register 10, login 10, content 14, session+measurement 26, no face 8, user isolation 8, logout 4, clarity 5, files 5) and the cloud checks (domain+HTTPS, /health, full flow, data persists, availability), each with exact steps and expected result, and empty "Local" / "Cloud" result columns for us to fill.
2. Read the backend and frontend code and create docs/PROJECT_INFO_draft.md with an answer for every field of PROJECT_INFO (field names exactly as in the template: project_name, authors, one_sentence_description, main_content_type, what_is_a_content_item, sample_content_type, sample_content_for_testing, interface_language, backend_framework, frontend_framework, database, what_is_measured, models_used, model_highlights, changes_to_recommended_api, how_to_register, what_is_a_session, how_to_start_a_session, camera_notes, where_the_score_appears, seconds_until_first_score, low_focus_reaction, how_to_end_a_session, run_command, setup_notes, password_storage, password_rules, token_handling, access_control, data_isolation, input_validation, camera_and_face_data, secrets_handling, extra_account_security, works_fully, partially_works_or_missing, known_issues, plugin, extra_features, what_makes_it_yours).
   Every security answer must name the concrete library, algorithm and value as implemented in the code (verify in code, do not guess). Button names must match the UI text exactly. Leave TODO markers where only humans know (authors, sample link, honest known issues). No secrets, no URLs with credentials.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T29"), push the branch and open a PR. Do not merge.
```

**ידני אחרי ה-PR:** מעתיקים את התשובות לעמודה האחרונה של קובץ ה-docx המקורי (בלי לשנות שמות שדות ובלי למחוק שורות) ושומרים כ-`docs/PROJECT_INFO.docx`.

## T30 – פריסה סופית לענן והגשת מטלה 4
- **אחראי:** A · **תלוי ב:** T37 (גרסת v1 הסופית) · **ענף:** `infra/T30-cloud-release`

**הסבר מראש הצוות:** פורסים לענן בדיוק את תג `v1` שהוגש במטלה 3, כך שהבודקים רואים אותו אתר בשתי המטלות. בחלון הבדיקה מפעילים `--grading`, כדי שלשרת יהיה מופע אחד חם תמיד. לא לשכוח לאשר את No-IP ולבדוק שנשאר קרדיט.

**הגדרת סיום:**
- [ ] `TAG=v1 scripts/gcp/deploy.sh --grading` עבר
- [ ] צ'קליסט הענן ב-`docs/ACCEPTANCE.md` ירוק ממחשב אחר ומטלפון
- [ ] קובץ `<project>.json` נוצר ונבדק

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
```bash
docker run --rm -v "$PWD:/mnt" -w /mnt koalaman/shellcheck:stable scripts/make-cloud-submission.sh
scripts/make-cloud-submission.sh       # try http://... and a trailing "/" → both rejected
scripts/make-cloud-submission.sh       # real values → submission/<project>.json
python -m json.tool submission/<project>.json
python -c "import json,sys,os;p=sys.argv[1];d=json.load(open(p,encoding='utf-8'));assert os.path.basename(p)==d['project']+'.json';assert d['domain'].startswith('https://') and not d['domain'].endswith('/');assert d['members'];print('OK')" submission/<project>.json
TAG=v1 PROJECT_ID=<id> DOCKER_USER=<user> DOMAIN=<host> scripts/gcp/deploy.sh --grading
gcloud run services describe ff-backend  --region me-west1 --format="value(spec.template.spec.containers[0].image)"   # ...focusflow-backend:v1
gcloud run services describe ff-frontend --region me-west1 --format="value(spec.template.spec.containers[0].image)"   # ...focusflow-frontend:v1 (not the placeholder)
gcloud run services describe ff-backend  --region me-west1 --format=export | grep minScale   # '1'
curl -s https://<host>/health; curl -s https://<host>/config.js     # {"status":"ok"}; API_URL: ""
git diff origin/main...HEAD -- docs/CLOUD.md | grep '^+' | grep -cE "mongodb\+srv|AIza|JWT_SECRET=.{8,}"   # 0
```
- [ ] צ'קליסט הענן ב-ACCEPTANCE ירוק ממחשב אחר (חלון בסתר) ומטלפון בגלישה סלולרית
- [ ] `docs/CLOUD.md` מתאר את כל הרכיבים ואיך פורסים מחדש
- [ ] בקובץ ה-JSON השמות בעברית נקראים נכון (UTF-8)

**פרומפט:**
```
Task T30: cloud release and assignment 4 submission file. Follow GIT_WORKFLOW.md: create branch infra/T30-cloud-release from an up-to-date main before changing anything.

- scripts/make-cloud-submission.sh: asks for project id (lowercase, a-z0-9 and dashes only), domain and member full names; validates that domain starts with https:// and has no trailing slash; curls <domain>/health and fails if not 200; writes submission/<project>.json exactly as:
  {"project": "<id>", "domain": "https://...", "members": ["...", "..."]}
  pretty-printed with 2 spaces, UTF-8 (Hebrew names allowed), and validates it with python3 -m json.tool.
- docs/CLOUD.md: one page describing the final setup for the defense: Cloud Run services and instance settings, Atlas choice and network access reason, URL map rules, managed certificate, Secret Manager secrets and the service account role, budget alerts, No-IP renewal reminder, and how to redeploy (build-and-push.sh then deploy.sh). No secret values.
Do not run deploy commands yourself; print the commands I should run.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T30"), push the branch and open a PR. Do not merge.
```

---

# חלק 6: בונוסים (רק אחרי ש-T29 ו-T36 ירוקים, ולפני T37)

> הבונוסים של מטלה 3 שמעבר ל-100 עוברים גם למטלה 4. עושים לפי הסדר, ועוצרים כשנגמר הזמן. אחרי כל בונוס: פריסה לענן ובדיקה שהבסיס לא נשבר. **כל בונוס חייב להיות ממוזג ובדוק לפני T37** – מה שלא נכנס ל-v1 לא נבדק ולא מקבל נקודות. בונוס שלא הספקתם לסיים – לא ממזגים בכלל.

## T31 – דף אינטרנט כסוג תוכן (עד 3)
- **אחראי:** A (שרת) + B (לקוח) · **ענף:** `feat/T31-web-content`

**הסבר מראש הצוות:** אתרים חוסמים iframe, לכן השרת שולף את הדף ומחלץ טקסט. הסיכון: SSRF – משתמש שגורם לשרת לפנות לכתובות פנימיות (בענן זה מסוכן במיוחד, למשל שרת המטא-דאטה של Google). חוסמים כתובות פרטיות ובודקים כל הפניה מחדש.

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
```bash
cd backend && pytest -q -k web && cd ..          # SSRF tests with mocked DNS
A=$(tok alice@test.com)
for u in http://127.0.0.1:8000/health http://localhost/ http://169.254.169.254/computeMetadata/v1/ \
         http://metadata.google.internal/ http://mongodb:27017/ http://10.0.0.1/ "http://[::1]/" ftp://example.com/ file:///etc/passwd; do
  call POST /api/content "$A" "{\"title\":\"x\",\"type\":\"web\",\"source\":\"$u\"}" | tail -1; done   # 422 every time
call POST /api/content "$A" '{"title":"x","type":"web","source":"https://httpbin.org/redirect-to?url=http://169.254.169.254/"}'   # 422 – redirects are re-checked
call POST /api/content "$A" '{"title":"","type":"web","source":"https://en.wikipedia.org/wiki/Attention"}'   # 201, title from the page, plain text without HTML
```
- [ ] במסך: "דף אינטרנט (קישור)" בטופס; בצפייה – הטקסט ב-TextReader, והקישור "פתיחת המקור בחלון חדש" עם `target="_blank" rel="noopener noreferrer"`
- [ ] סשן עם מדידות עובד על פריט web (המיקום באחוזים)
- [ ] בענן אותה בדיקה עם `169.254.169.254` → 422 (שם זה באמת מסוכן)
- [ ] רגרסיה: צעדים 1–3 של T27 עדיין עובדים

**פרומפט:**
```
Task T31: web page content type. Follow GIT_WORKFLOW.md: create branch feat/T31-web-content from an up-to-date main before changing anything.

Backend: add type "web". Validate URL (http/https, <= 2000 chars). Resolve the host; reject private, loopback, link-local (incl. 169.254.169.254), multicast, reserved IPs and hostnames localhost/mongodb/metadata.google.internal. Fetch with httpx (timeout 10s, max 2MB streamed, max 3 redirects, re-validating every hop, User-Agent "FocusFlowBot/1.0"). Extract main text with trafilatura (no HTML stored). Empty/failed -> 422 {"message":"Could not read text from this page"}. Store source=url, extracted_text, and use the page title if the user's title is empty. Add tests (SSRF cases with mocked DNS).
Frontend: add "דף אינטרנט (קישור)" in the library form; Watch renders extracted_text in TextReader plus a link "פתיחת המקור בחלון חדש" (target _blank, rel noopener noreferrer).

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T31"), push the branch and open a PR. Do not merge.
```

## T32 – עבודה מקורית עם המודל (עד 4)
- **אחראי:** C · **ענף:** `feat/T32-model-smoothing`

**הסבר מראש הצוות:** מודל על חלון של 10 שניות "רועש". החלקה וסף של שתי מדידות רצופות מונעים התראות שווא – וזה נימוק טוב בהגנה. הסיווג לחמש רמות של v4_2 נותן תווית שמשתמש מבין.

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
- [ ] ב-Watch: הרמה (אחת מחמש התוויות) מתחת לציון; "פרטים" מציג raw מול smoothed, וה-smoothed חלק יותר
- [ ] קריאת קוד או טסט: `smoothed = 0.4·raw + 0.6·previous`
- [ ] מבט הצידה לחלון אחד בלבד → אין התראה; שתי מדידות smoothed רצופות מתחת ל-0.4 → התראה
- [ ] `call GET /api/sessions/<id> "$A"` → בכל מדידה `level` בין 0 ל-4, והציון הוא ה-smoothed
- [ ] `call POST /api/sessions/<open id>/readings "$A" '{"position":1,"score":0.5,"level":5}'` → 422; בלי `level` → 201
- [ ] `model_highlights` ו-`low_focus_reaction` ב-`docs/PROJECT_INFO_draft.md` עודכנו
- [ ] pytest ירוק + רגרסיה (צעדים 1–3 של T27)

**פרומפט:**
```
Task T32: model smoothing and 5-level class. Follow GIT_WORKFLOW.md: create branch feat/T32-model-smoothing from an up-to-date main before changing anything.

- useAttention: exponential smoothing (alpha 0.4) -> smoothedScore; expose raw and smoothed.
- Find the class output in raw outputs (shape [1,5]) by name or shape; level = argmax; labels: ["לא נמצא במצלמה","לא קשוב","קשב חלש","קשוב","קשוב מאוד"]. Show the level under the score; a "פרטים" toggle shows raw vs smoothed.
- LowFocusAlert triggers only when smoothed < 0.4 for 2 consecutive predictions.
- Readings send the smoothed score and an optional "level" (0-4); backend reading schema accepts optional level (int 0..4) and returns it.
- Update docs/PROJECT_INFO_draft.md fields model_highlights and low_focus_reaction.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T32"), push the branch and open a PR. Do not merge.
```

## T33 – דף אנליטיקה (עד 4)
- **אחראי:** A (API) + B (מסך) · **ענף:** `feat/T33-analytics`

**הסבר מראש הצוות:** מראה קשב לאורך זמן ובין סשנים. את החישוב עושים בשרת באגרגציה אחת – כך הדף מהיר גם עם הרבה סשנים, ונשאר מסונן לפי המשתמש.

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
מכינים לאליס שני סשנים שהסתיימו, על שני פריטים שונים: (1) 0.2, 0.6, 1.0 (2) 0.3, 0.3, 0.3, 0.3, 0.9.
```bash
call GET /api/analytics "$A"
# sessions: 2, oldest first; total_measured_minutes = 8*2/60 ≈ 0.27; low_share = 5/8 = 0.625;
# best_content = the 2nd item (the only one with >= 5 readings);
# overall_average = 3.9/8 = 0.4875 if computed over readings – the PR must state which definition was used
call GET /api/analytics "$B"     # empty/zeros – none of Alice's data
```
- [ ] מסך `/analytics` (קישור "ניתוח" בסרגל): 4 כרטיסים עם אותם ערכים, גרף ממוצע לפי סשן עם קו 0.4, ופס צבעוני לסשן האחרון שמראה איפה הקשב ירד
- [ ] משתמש חדש → מצב ריק
- [ ] pytest ירוק, כולל טסט הפרדה

**פרומפט:**
```
Task T33: analytics. Follow GIT_WORKFLOW.md: create branch feat/T33-analytics from an up-to-date main before changing anything.

Backend: GET /api/analytics (auth, owner only, one aggregation): sessions [{id, date, content_title, average_score, reading_count}] oldest->newest, overall_average, total_measured_minutes (reading_count*2/60), low_share (share of readings < 0.4), best_content (highest average with >= 5 readings). Tests including isolation.
Frontend: src/pages/Analytics.jsx (/analytics, link "ניתוח" in the header): 4 summary cards, inline SVG line chart of average per session over time with the 0.4 line, and for the latest session a horizontal strip colored by score along the content position showing where attention dropped. Empty state when no sessions.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T33"), push the branch and open a PR. Do not merge.
```

## T34 – תמיכה בטלפון (עד 3)
- **אחראי:** B · **ענף:** `feat/T34-mobile`

**הסבר מראש הצוות:** בזכות הענן עם HTTPS אפשר לבדוק בטלפון אמיתי, כולל מצלמה. בודקים כל מסך ברוחב 375px.

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
- [ ] DevTools → device toolbar → iPhone SE (375px) ו-Pixel 7. בכל דף (register, login, library, watch, history, session detail, profile, analytics, 404) בקונסול: `document.documentElement.scrollWidth <= window.innerWidth` → `true`
- [ ] הסרגל העליון נשבר לשתי שורות, וכל הקישורים נגישים
- [ ] Watch: התוכן מעל הפאנל, ותצוגת המצלמה קטנה
- [ ] מתחת ל-600px הטבלאות מוצגות ככרטיסים (תווית: ערך)
- [ ] `getComputedStyle(document.querySelector("input")).fontSize` → `"16px"`; כל הכפתורים בגובה 44px לפחות
- [ ] ב-`index.html` יש `<meta name="viewport" content="width=device-width, initial-scale=1">`
- [ ] בטלפון אמיתי דרך `https://<domain>`: הרשמה, וסשן עם מצלמה קדמית וציון
- [ ] ה-PR מפרט מה נבדק בכל מכשיר

**פרומפט:**
```
Task T34: mobile support. Follow GIT_WORKFLOW.md: create branch feat/T34-mobile from an up-to-date main before changing anything.

Make every page usable at 375px: header wraps into two rows; Watch stacks content above the side panel and the camera preview is small; tables become stacked cards under 600px (label: value); inputs font-size 16px (no iOS zoom); buttons >= 44px; no horizontal scroll anywhere. Add <meta name="viewport" content="width=device-width, initial-scale=1">. Check with DevTools device mode (iPhone SE, Pixel 7) and list in the PR what you verified; we will also test on a real phone via the cloud domain.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T34"), push the branch and open a PR. Do not merge.
```

## T35 – סיכום עם Gemini שעובד גם בלי מפתח (עד 4)
- **אחראי:** A · **ענף:** `feat/T35-gemini-summary`

**הסבר מראש הצוות:** בהגשה המפתח ריק, אז הבודק יראה בעיקר את ה"כישלון המנומס" – הוא חייב להיות יפה. בענן המפתח מגיע מ-Secret Manager בלבד.

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
```bash
grep GEMINI_API_KEY .env                         # empty
A=$(tok alice@test.com); C=$(call GET /api/content "$A" | head -1 | python -c "import sys,json;print(json.load(sys.stdin)[0]['id'])")
call POST /api/content/$C/summary "$A"           # 503 {"message":"הסיכום האוטומטי לא מוגדר בשרת הזה"}, immediately
call POST /api/content/$C/summary "$B"           # 404 – another user's item
cd backend && pytest -q -k summary               # mocked SDK + the empty-key path
```
- [ ] ב-Watch בלי מפתח: "סיכום קצר" → הודעה ניטרלית (לא אדומה), ושום דבר לא נשבר
- [ ] עם מפתח אמיתי (רק ב-`.env` המקומי, לא ב-commit): טקסט → 5 נקודות בעברית; סרטון → סיכום לפי הכותרת בלבד
- [ ] `GEMINI_API_KEY=invalid` → 502 "לא הצלחנו ליצור סיכום כרגע"
- [ ] `docker compose -f docker-compose.dev.yml logs backend | grep -c "<6 התווים הראשונים של המפתח>"` → 0
- [ ] `grep GEMINI_API_KEY submission/.env.template` → ריק

**פרומפט:**
```
Task T35: Gemini summary with graceful fallback. Follow GIT_WORKFLOW.md: create branch feat/T35-gemini-summary from an up-to-date main before changing anything.

Backend: POST /api/content/{id}/summary (auth, owner only). GEMINI_API_KEY empty -> 503 {"message":"הסיכום האוטומטי לא מוגדר בשרת הזה"} without any external call. Otherwise use the google-genai SDK (model name from env GEMINI_MODEL with a sensible default), input = text/web content truncated to 20k chars (YouTube: title only, say so in the prompt), ask for a 5-bullet Hebrew summary; timeout 20s; errors -> 502 {"message":"לא הצלחנו ליצור סיכום כרגע"}. Never log the key. Tests mock the SDK and cover the empty-key path.
Frontend: in Watch, button "סיכום קצר" -> loading "יוצר סיכום..." -> result as plain text list, or the server message in a neutral (not red) notice.
Update scripts/gcp/deploy.sh only if needed (gemini-key secret is already optional).

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T35"), push the branch and open a PR. Do not merge.
```

---

# חלק 7: סגירה – תיקונים, גרסה, הגשה, הגנה ופירוק

> בלי החלק הזה, גם אם כל הקוד גמור, הפרויקט לא נגמר: תקלות מבדיקת הקבלה נשארות פתוחות, מה שמוגש לא בהכרח זהה למה שנבדק, והאתר בענן יכול ליפול בזמן הבדיקה.

## T36 – תיקון תקלות מבדיקת הקבלה
- **אחראי:** מי שכתב את החלק השבור · **תלוי ב:** T29 · **ענף:** `fix/T36-<issue#>-<slug>` (ענף ו-PR לכל תקלה)

**הסבר מראש הצוות:** T29 מוצא תקלות, ובלי משימה מסודרת לתיקון הן נשארות פתוחות. כל שורה אדומה ב-ACCEPTANCE, או בעיה שמישהו מצא, הופכת ל-Issue עם תבנית bug ותווית `acceptance`, ענף `fix/T36-...` ו-PR שמסביר איך לשחזר ואיך לבדוק. אחרי כל תיקון מריצים מחדש את השורה הרלוונטית ב-ACCEPTANCE ואת צעדים 1–3 של T27, כדי לוודא ששום דבר אחר לא נשבר.

**הגדרת סיום:**
- [ ] אין Issues פתוחים עם התווית `acceptance`
- [ ] כל השורות ב-ACCEPTANCE ירוקות מקומית, ובענן אחרי פריסה של `main`

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
- [ ] הבודק משחזר את התקלה על `main` (נכשל) ועל הענף (עובד)
- [ ] באג בשרת → יש טסט חדש שנכשל בלי התיקון: `git checkout origin/main -- backend/app && cd backend && pytest -q` → הטסט החדש נכשל; `cd .. && git checkout HEAD -- backend/app && cd backend && pytest -q` → הכל ירוק
- [ ] תיאור ה-PR כולל "Fixes #<N>" (ה-Issue נסגר במיזוג) ואת שורות ה-ACCEPTANCE שהורצו מחדש
- [ ] GitHub → Issues → `is:open label:acceptance` → 0

**פרומפט (לכל תקלה):**
```
Task T36: fix GitHub issue #<N> – <title>. Follow GIT_WORKFLOW.md: create branch fix/T36-<N>-<short-slug> from an up-to-date main before changing anything.

Issue (steps, expected, actual): <paste the issue text>
First reproduce it (for backend logic, write a failing test first), then fix the root cause with the smallest change and make sure the test passes. In the PR: "Fixes #<N>", exact steps to reproduce before/after, and which docs/ACCEPTANCE.md rows you re-ran.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T36"), push the branch and open a PR. Do not merge.
```

## T37 – הקפאת גרסה v1 ואריזת מטלה 3
- **אחראי:** A (כולם בודקים) · **תלוי ב:** T36, וכל בונוס שנבחר (T31–T35) ממוזג · **ענף:** `chore/T37-release-v1` (רק מסמכים; הבנייה ידנית)

**הסבר מראש הצוות:** מה שמוגש הוא תג `v1`: תמונות ב-Docker Hub שנבנו מ-`main` אחרי כל התיקונים והבונוסים. מרגע ההקפאה לא ממזגים קוד ל-`main` עד אחרי הציון. אם חייבים תיקון קריטי, בונים את v1 מחדש ומריצים שוב את כל הבדיקות של המשימה הזו. PROJECT_INFO הסופי מתאר בדיוק את v1: הבונוסים שנכנסו, ובכנות מה לא עובד.

**ידני (אחרי מיזוג ה-PR של המשימה):**
- [ ] `git checkout main && git pull --rebase`, ו-`git status` נקי
- [ ] `TAG=v1 DOCKER_USER=<user> scripts/build-and-push.sh`
- [ ] מעתיקים את התשובות מ-`docs/PROJECT_INFO_draft.md` לתבנית המקורית ושומרים כ-`docs/PROJECT_INFO.docx`
- [ ] `scripts/make-submission.sh` → `submission/assignment3.zip`
- [ ] תג git על ה-commit שממנו נבנו התמונות: `git tag -a v1 -m "Assignment 3+4 submission" && git push origin v1`

**הגדרת סיום:**
- [ ] תמונות v1 ב-Docker Hub נבנו מה-commit האחרון של `main`, ותג git `v1` מצביע עליו
- [ ] `submission/assignment3.zip` עובר בדיקת קבלה מלאה על מחשב נקי
- [ ] PROJECT_INFO סופי, בלי TODO

**איך בודקים שהמשימה בוצעה נכון** (בנוסף לבדיקות R1–R6):
```bash
git rev-parse v1 origin/main                     # the same commit
grep -c TODO docs/PROJECT_INFO_draft.md          # 0
docker manifest inspect <user>/focusflow-backend:v1  | grep architecture   # amd64
docker manifest inspect <user>/focusflow-frontend:v1 | grep architecture   # amd64
docker buildx imagetools inspect <user>/focusflow-backend:v1  | grep -m1 Digest   # write both digests in the PR –
docker buildx imagetools inspect <user>/focusflow-frontend:v1 | grep -m1 Digest   # if they change later, someone re-pushed v1
unzip -l submission/assignment3.zip              # exactly docker-compose.yml, .env, PROJECT_INFO.docx (+ extension/ only if it exists)
scripts/test-clean-run.sh                        # OK
```
- [ ] **בדיקת קבלה מלאה על v1:** במחשב שלא בנה כלום, רק מתוך ה-zip (`unzip submission/assignment3.zip -d /tmp/ff-v1 && cd /tmp/ff-v1 && docker compose up`) – כל 10 שורות הציון ב-ACCEPTANCE ירוקות, כולל OBS
- [ ] שמות הקבצים ב-zip באותיות בדיוק כמו בהנחיות, וה-zip נפתח גם ב-Windows
- [ ] PROJECT_INFO.docx שבתוך ה-zip הוא הגרסה הסופית (פותחים אותו מתוך ה-zip ובודקים 3 שדות)
- [ ] `run_command` ב-PROJECT_INFO עובד בדיוק כמו שכתוב

**פרומפט:**
```
Task T37: release v1 docs. Follow GIT_WORKFLOW.md: create branch chore/T37-release-v1 from an up-to-date main before changing anything.

1. Read the code on main and update docs/PROJECT_INFO_draft.md so it describes exactly what is on main now: extra_features (only merged bonuses), changes_to_recommended_api, model_highlights, works_fully / partially_works_or_missing / known_issues (from docs/ACCEPTANCE.md results and open issues). List every remaining TODO for me; do not invent answers.
2. Update README.md: run instructions for graders (docker compose up with the submitted files), local development, and links to docs/CLOUD.md and docs/ACCEPTANCE.md.
3. Print (do not run) the release commands in order: build-and-push.sh with TAG=v1, make-submission.sh, test-clean-run.sh, git tag v1.

When done: run the checks from GIT_WORKFLOW.md, commit in small logical commits using the commit format (with "How to test" and "Task: T37"), push the branch and open a PR. Do not merge.
```

## T38 – הגשת מטלות 3 ו-4
- **אחראי:** ראש הצוות (כולם מאשרים) · **תלוי ב:** T37, T30 · **ענף:** אין (ידני)

**הסבר מראש הצוות:** הגשה שלא הגיעה, או קובץ לא נכון, שווה אפס גם אם הקוד מושלם. מגישים בדיוק לפי ההנחיות ב-`docs/assignment/` (מקום, שם קובץ, מועד), ומוודאים שמה שהועלה זהה למה שנבדק.

**צ'קליסט:**
- [ ] בודקים בהנחיות: איפה מגישים, מי מגיש (אחד לקבוצה או כל אחד), שמות הקבצים ומועד ההגשה – ורושמים בהודעה מוצמדת לצוות
- [ ] מעלים `submission/assignment3.zip` (מטלה 3)
- [ ] מעלים `submission/<project>.json` (מטלה 4)
- [ ] שומרים צילום מסך של אישור ההגשה

**הגדרת סיום:**
- [ ] שני הקבצים הוגשו לפני המועד, וכל הצוות ראה את האישור

**איך בודקים שהמשימה בוצעה נכון:**
```bash
sha256sum submission/assignment3.zip submission/<project>.json     # post in the team chat
# download the uploaded files back from the submission system, then:
sha256sum ~/Downloads/assignment3.zip ~/Downloads/<project>.json   # identical hashes
unzip -l ~/Downloads/assignment3.zip                               # 3 files at the top level
```
- [ ] ה-`domain` שב-JSON נפתח עם מנעול ממחשב אחר, ו-`/health` מחזיר 200
- [ ] אם המערכת לא מאפשרת להוריד בחזרה – לפחות צילום מסך עם שם הקובץ והגודל שלו

## T39 – חלון הבדיקה: האתר זמין עד הציון
- **אחראי:** A · **תלוי ב:** T38 · **ענף:** אין (ידני)

**הסבר מראש הצוות:** במטלה 4 הבודק נכנס לדומיין מתי שנוח לו. אם No-IP פג, התעודה נפלה, הקרדיט נגמר או מישהו פרס גרסה אחרת – האתר שבור בדיוק בזמן הבדיקה. בחלון הזה **לא פורסים, לא ממזגים קוד ולא דוחפים תמונות בתג v1**, ובודקים כל יום.

**לפני תחילת החלון:**
- [ ] `TAG=v1 ... scripts/gcp/deploy.sh --grading` (מופע חם אחד לשרת)
- [ ] No-IP: מאשרים את ה-hostname, כך שתאריך התפוגה אחרי סוף החלון
- [ ] Billing: נשאר מספיק קרדיט לכל החלון (עלות יומית × מספר ימים)
- [ ] Atlas: ה-cluster לא במצב Paused

**הגדרת סיום:**
- [ ] כל יום עד קבלת הציון, הבדיקה היומית למטה ירוקה

**איך בודקים (כל יום, עד הציון):**
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<host>/health          # 200
gcloud compute ssl-certificates describe ff-cert --global --format="get(managed.status)"   # ACTIVE
nslookup <host>                                                         # still the ff-ip address
gcloud run services describe ff-backend  --region me-west1 --format="value(spec.template.spec.containers[0].image)"   # still :v1
gcloud run services describe ff-frontend --region me-west1 --format="value(spec.template.spec.containers[0].image)"   # still :v1
docker buildx imagetools inspect <user>/focusflow-backend:v1 | grep -m1 Digest   # same digest as recorded in T37
```
- [ ] פעם אחת במהלך החלון: הרשמה וסשן קצר עם מצלמה מטלפון בגלישה סלולרית
- [ ] מיילים מ-Budget ומ-No-IP נקראים ומטופלים באותו יום
- [ ] משהו נשבר? מתקנים רק תשתית (DNS, תעודה, סוד), לא קוד, ומודיעים לצוות

## T40 – הכנה להגנה
- **אחראי:** כולם · **תלוי ב:** T37 · **ענף:** אין

**הסבר מראש הצוות:** בהגנה כל אחד צריך להסביר גם את מה שלא כתב, ולנמק את הבחירות. החומר כבר קיים: "שאלות הגנה – תשובות מוכנות" במסמך התכנון, `docs/CLOUD.md`, סעיפי האבטחה ב-PROJECT_INFO ו-`src/attention/README.md`.

**צ'קליסט:**
- [ ] כל אחד קרא את התיאור ואת How to test של כל ה-PR-ים הממוזגים של האחרים
- [ ] תסריט הדגמה של 5 דקות: הרשמה → תוכן → סשן עם מצלמה → אין פנים → היסטוריה → הענן בטלפון
- [ ] גיבוי להדגמה בלי אינטרנט מהיר: גרסה מקומית מה-zip מוכנה (`docker compose up`)

**הגדרת סיום:**
- [ ] הגנה מדומה עברה לפי הבדיקה למטה

**איך בודקים – הגנה מדומה (30 דקות):**
- [ ] כל חבר צוות עונה בלי דפים על 5 שאלות אקראיות: שאלות ההגנה במסמך התכנון; למה 404 ולא 403; איך עובדת התנתקות עם JWT (`jti`); למה `token_version`; למה הגבלת הניסיונות ב-Mongo ולא בזיכרון; מה נשלח לשרת מהמצלמה ומה לא; למה `numThreads = 1`; למה חלון של 100 פריימים ומדידה כל 2 שניות; איך ה-LB מחליט לאן לשלוח בקשה; למה `API_URL` ריק בענן; איך הסודות מגיעים ל-Cloud Run; מה קורה כשיש שני מופעים
- [ ] כל אחד מסביר קובץ אחד שהוא **לא** כתב (שרת/לקוח/מודל), ומוצא אותו בעורך תוך פחות מדקה
- [ ] ההדגמה רצה מההתחלה עד הסוף בפחות מ-5 דקות, פעמיים ברצף
- [ ] כל שאלה שנתקענו בה נוספת עם תשובה ל-`docs/CLOUD.md` או ל-README (PR קטן)

## T41 – אחרי הציון: פירוק וסגירה
- **אחראי:** A · **תלוי ב:** ציון סופי בשתי המטלות (כולל ערעורים) · **ענף:** אין (ידני)

**הסבר מראש הצוות:** מאזן עומסים, כתובת IP קבועה ומופע חם עולים כסף כל שעה, גם בלי משתמשים. מפרקים **רק** אחרי שהציונים סופיים – אם הבודקים חוזרים ומוצאים אתר מת, זה אפס.

**צ'קליסט:**
- [ ] `scripts/gcp/teardown-lb.sh` (מאשרים כשנשאלים)
- [ ] `gcloud run services delete ff-backend --region me-west1` ואותו דבר ל-`ff-frontend`
- [ ] `gcloud secrets delete mongo-url`, `gcloud secrets delete jwt-secret` (ו-`gemini-key` אם קיים)
- [ ] Atlas: מוחקים את ה-cluster, או לפחות את משתמש המסד
- [ ] No-IP: מוחקים את ה-hostname או משאירים אותו לפוג
- [ ] GitHub: הריפו נשאר פרטי; Issues פתוחים נסגרים עם הערה

**הגדרת סיום:**
- [ ] אין משאבים בתשלום בפרויקט GCP

**איך בודקים שהמשימה בוצעה נכון:**
```bash
gcloud compute forwarding-rules list --global      # empty
gcloud compute addresses list --global             # no ff-ip
gcloud run services list --region me-west1         # empty
gcloud secrets list                                # empty
```
- [ ] Billing → Reports: אחרי יומיים העלות היומית היא 0$

---

# הפרויקט גמור כאשר

הפרויקט גמור כשכל משימות החובה למטה מסומנות – כל אחת אחרי שה-"איך בודקים" שלה עבר וה-PR מוזג (במשימות ידניות: אחרי שהבדיקה עברה). בונוסים לא נדרשים לסיום, אבל בונוס שהתחלתם חייב להיות ממוזג ובדוק לפני T37, או לא ממוזג בכלל.

**רשימת מעקב – חובה:**
- [ ] T00 – חומרי המטלה ומיפוי דרישות
- [x] T01 – שלד הריפו (PR #1)
- [ ] T02 – כללים לסוכני ה-AI
- [ ] T03 – הגדרות GitHub ותבנית PR
- [ ] T04 – בסיס השרת
- [ ] T05 – Docker לשרת ו-Compose לפיתוח
- [ ] T06 – חשבונות ענן
- [ ] T07 – סקריפטי בנייה וסודות
- [ ] T08 – פריסה ל-Cloud Run
- [ ] T09 – מאזן עומסים, תעודה ודומיין
- [ ] T10 – משתמשים: אינדקסים ו-security.py
- [ ] T11 – הרשמה והתחברות
- [ ] T12 – זיהוי משתמש, התנתקות ו-/me
- [ ] T13 – API תוכן
- [ ] T14 – API סשנים ומדידות
- [ ] T15 – API פרופיל (נקודות בונוס, אבל חלק מהתוכנית)
- [ ] T16 – פרויקט React
- [ ] T17 – לקוח API, התחברות וניווט
- [ ] T18 – מסכי הרשמה והתחברות
- [ ] T19 – מסך הספרייה
- [ ] T20 – Docker ללקוח
- [ ] T21 – היסטוריה ופרטי סשן
- [ ] T22 – מסך פרופיל (נקודות בונוס, אבל חלק מהתוכנית)
- [ ] T23 – MediaPipe ו-ONNX
- [ ] T24 – לולאת המדידה
- [ ] T25 – רכיבי מצלמה, ציון והתראה
- [ ] T26 – נגן YouTube ותצוגת טקסט
- [ ] T27 – מסך הצפייה
- [ ] T28 – קבצי ההגשה של מטלה 3
- [ ] T29 – בדיקת קבלה ו-PROJECT_INFO
- [ ] T36 – תיקון התקלות מבדיקת הקבלה
- [ ] T37 – הקפאת v1 ואריזה
- [ ] T30 – פריסה סופית לענן וקובץ מטלה 4
- [ ] T38 – הגשה
- [ ] T39 – חלון הבדיקה
- [ ] T40 – הגנה
- [ ] T41 – פירוק אחרי הציון

**בונוסים (אופציונלי, לפני T37):** - [ ] T31 · - [ ] T32 · - [ ] T33 · - [ ] T34 · - [ ] T35

**בדיקת סיום אחרונה – כל השורות חייבות להיות נכונות:**
- [ ] ב-`docs/REQUIREMENTS.md` כל דרישה מקושרת למשימה גמורה, ואין `MISSING`
- [ ] `docs/ACCEPTANCE.md` ירוק במלואו: Local (מה-zip, על מחשב נקי) ו-Cloud (ממחשב אחר ומטלפון)
- [ ] GitHub: אין Issues פתוחים עם התווית `acceptance`, ואין PR פתוח שצריך להיכנס להגשה
- [ ] שני קבצי ההגשה הועלו ואומתו (T38), והאתר בענן היה זמין לאורך כל חלון הבדיקה (T39)
- [ ] ההגנה עברה (T40), ואחרי הציון הסופי המשאבים בענן פורקו (T41)

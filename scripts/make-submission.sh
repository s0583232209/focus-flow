#!/usr/bin/env bash
# Build submission/assignment3.zip: docker-compose.yml, .env and PROJECT_INFO.docx at the
# top level (plus extension/ if it exists). A new one-time JWT_SECRET on every run.
#
# Usage: DOCKER_USER=<docker hub user> scripts/make-submission.sh
#
# בונה את קובץ ההגשה submission/assignment3.zip: docker-compose.yml, .env ו-PROJECT_INFO.docx
# בשורש ה-zip. בכל הרצה נוצר JWT_SECRET חד-פעמי חדש.

# -e: עצירה בשגיאה הראשונה; -u: שגיאה על משתנה לא מוגדר; pipefail: כישלון באמצע צינור (|) נחשב כישלון
set -euo pipefail

# ${VAR:?הודעה} – אם DOCKER_USER חסר, הסקריפט נעצר עם ההודעה. ":" היא פקודה שלא עושה כלום
: "${DOCKER_USER:?Set DOCKER_USER to the Docker Hub user that holds the v1 images}"
# עוברים לשורש הריפו, כדי שהנתיבים למטה יעבדו מכל תיקייה
cd "$(git rev-parse --show-toplevel)"

# בלי PROJECT_INFO אין הגשה
if [ ! -f docs/PROJECT_INFO.docx ]; then
  echo "docs/PROJECT_INFO.docx is missing: fill in the original template first." >&2
  exit 1
fi

# מוצאים את הפייתון הראשון שבאמת רץ (ב-Windows "python3" יכול להיות קיצור דרך ל-Store)
find_python() {
  local candidate
  for candidate in python3 python "py -3"; do
    # מנסים להריץ פקודה ריקה; הפלט נזרק (>/dev/null)
    if $candidate -c "import sys" >/dev/null 2>&1; then
      echo "$candidate"
      return 0
    fi
  done
  echo "Python is required to build the zip." >&2
  return 1
}
PYTHON="$(find_python)"

# 48 בתים אקראיים → base64, בלי תווים שעלולים להפריע בקובץ env (שורה חדשה, =, +, /)
jwt_secret="$(head -c 48 /dev/urandom | base64 | tr -d '\n=+/')"

# תמיד סופי שורה LF: תו CR מיותר היה הופך לחלק מהערך.
# tr מוחק CR; sed מחליף את שורות JWT_SECRET ו-DOCKER_USER בערכים האמיתיים; > כותב לקובץ
tr -d '\r' <submission/.env.template |
  sed -e "s|^JWT_SECRET=.*|JWT_SECRET=$jwt_secret|" \
    -e "s|^DOCKER_USER=.*|DOCKER_USER=$DOCKER_USER|" >submission/.env

# אריזת ה-zip בפייתון (הפקודה zip לא מותקנת בכל מחשב). הקוד עד PY נשלח לפייתון כמו שהוא
# shellcheck disable=SC2086
$PYTHON - <<'PY'
import os
import zipfile

out = "submission/assignment3.zip"
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:  # יצירת zip דחוס
    z.write("docker-compose.yml", "docker-compose.yml")  # (קובץ מקור, השם בתוך ה-zip)
    z.write("submission/.env", ".env")  # בתוך ה-zip נקרא פשוט .env
    z.write("docs/PROJECT_INFO.docx", "PROJECT_INFO.docx")
    for root, _dirs, files in os.walk("extension"):  # תיקיית extension רק אם קיימת (os.walk לא מחזיר כלום אחרת)
        for name in files:
            path = os.path.join(root, name)
            z.write(path, path.replace(os.sep, "/"))  # ב-zip תמיד "/" גם ב-Windows

with zipfile.ZipFile(out) as z:  # הדפסת התוכן לבדיקה
    print(out)
    for info in z.infolist():
        print(f"{info.file_size:>10}  {info.filename}")  # גודל מיושר לימין ב-10 תווים, ואז השם
PY

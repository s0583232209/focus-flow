#!/usr/bin/env bash
# Run the submission the way the grader does: only docker-compose.yml and .env in an empty folder.
# Run scripts/make-submission.sh first. Ports 3000 and 8000 must be free.
#
# Usage: scripts/test-clean-run.sh [--teardown]
#   --teardown  stops the containers and deletes the test data at the end
#
# מריץ את ההגשה כמו שהבודק יריץ: רק docker-compose.yml ו-.env בתיקייה ריקה.

# עצירה בשגיאה, במשתנה לא מוגדר, ובכישלון בצינור
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"  # שורש הריפו

# צריך קודם להריץ את make-submission.sh
if [ ! -f submission/.env ]; then
  echo "submission/.env is missing: run scripts/make-submission.sh first." >&2
  exit 1
fi

work_dir="$(mktemp -d)"  # תיקייה זמנית ריקה
cp docker-compose.yml "$work_dir/docker-compose.yml"  # רק שני הקבצים שהבודק מקבל
cp submission/.env "$work_dir/.env"
cd "$work_dir"

# מנקים הרצה קודמת (כולל הנתונים, -v); || true = לא להיעצר אם אין מה לנקות
docker compose down -v --remove-orphans >/dev/null 2>&1 || true
docker compose up -d  # הפעלה ברקע (-d)

# מחכה עד שכתובת עונה: עד 60 ניסיונות, כל 2 שניות (כ-2 דקות)
wait_for() {
  local url="$1"  # הפרמטר הראשון
  local attempt
  for attempt in $(seq 1 60); do
    # -f: נכשל בסטטוס שגיאה; -sS: שקט אבל מציג שגיאות; --max-time 3: לא לחכות יותר מ-3 שניות
    if curl -fsS --max-time 3 "$url" -o /dev/null 2>/dev/null; then
      echo "OK   $url (after about $((attempt * 2)) s)"
      return 0
    fi
    sleep 2
  done
  echo "FAIL $url" >&2
  return 1
}

status=0  # 0 = הצלחה
wait_for http://localhost:8000/health || status=1  # השרת
wait_for http://localhost:3000 || status=1  # הלקוח

# ${1:-} = הפרמטר הראשון, או ריק אם לא הועבר
if [ "${1:-}" = "--teardown" ]; then
  docker compose down -v  # עצירה ומחיקת הנתונים
  rm -rf "$work_dir"  # מחיקת התיקייה הזמנית
else
  echo "Running from $work_dir. To stop it: cd \"$work_dir\" && docker compose down -v"
fi
exit "$status"  # קוד היציאה מספר אם הכל עבר

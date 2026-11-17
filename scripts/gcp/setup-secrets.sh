#!/usr/bin/env bash
# Create the backend service account and the secrets in Secret Manager.
# Values are read with hidden typing and piped to gcloud: they are never an argument,
# never echoed, and never stored in shell history or in a file.
#
# Usage: PROJECT_ID=<id> [REGION=me-west1] scripts/gcp/setup-secrets.sh
#
# יוצר את חשבון השירות של השרת ואת הסודות ב-Secret Manager.
# הערכים מוקלדים בהקלדה נסתרת ועוברים ל-gcloud בצינור: הם אף פעם לא ארגומנט,
# לא מודפסים, ולא נשמרים בהיסטוריית הטרמינל או בקובץ.

set -euo pipefail  # עצירה בכל שגיאה

: "${PROJECT_ID:?Set PROJECT_ID}"  # חובה
REGION="${REGION:-me-west1}"
export CLOUDSDK_CORE_PROJECT="$PROJECT_ID"  # כל פקודות gcloud יפעלו על הפרויקט הזה

SA_NAME="ff-backend-sa"  # שם חשבון השירות שהשרת רץ בשמו ב-Cloud Run
SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"  # הכתובת המלאה שלו

# האם הסוד קיים? (הפלט נזרק; רק קוד היציאה חשוב)
secret_exists() {
  gcloud secrets describe "$1" >/dev/null 2>&1
}

# יוצר סוד (רק את "המיכל", בלי ערך) אם הוא עוד לא קיים – כך אפשר להריץ את הסקריפט שוב בבטחה
ensure_secret() {
  if secret_exists "$1"; then
    echo "Secret $1 already exists."
  else
    gcloud secrets create "$1" --replication-policy=automatic >/dev/null  # Google בוחר איפה לשכפל
    echo "Created secret $1."
  fi
}

# שאלת כן/לא; ברירת המחדל לא. מחזירה הצלחה רק על y או Y
ask_yes() {
  local answer
  read -r -p "$1 [y/N] " answer
  [ "$answer" = "y" ] || [ "$answer" = "Y" ]
}

# מבקש ערך בהקלדה נסתרת ומוסיף אותו כגרסה חדשה של הסוד
add_typed_version() {
  local value  # local – המשתנה קיים רק בתוך הפונקציה
  read -r -s -p "Value for $1 (hidden): " value  # -s = ההקלדה לא מוצגת על המסך
  echo  # שורה חדשה (כי ההקלדה הנסתרת לא הדפיסה Enter)
  if [ -z "$value" ]; then  # -z = מחרוזת ריקה
    echo "Empty value: nothing added to $1."
    return 1
  fi
  # printf '%s' שולח את הערך בדיוק, בלי שורה חדשה בסוף; --data-file=- = קרא את הערך מהצינור
  printf '%s' "$value" | gcloud secrets versions add "$1" --data-file=- >/dev/null
  unset value  # מוחקים את הערך מהזיכרון של הסקריפט
  echo "Added a new version to $1."
}

add_random_jwt_secret() {
  # בלי צורך בפייתון, כך שזה עובד גם ב-Git Bash ב-Windows.
  # 48 בתים אקראיים → base64 בלי תווים מיוחדים → ישר ל-gcloud, בלי לעבור דרך משתנה או מסך
  head -c 48 /dev/urandom | base64 | tr -d '\n=+/' |
    gcloud secrets versions add jwt-secret --data-file=- >/dev/null
  echo "Added a generated value to jwt-secret."
}

# הפעלת השירותים של Google Cloud שהפרויקט צריך
echo "Enabling APIs..."
gcloud services enable run.googleapis.com compute.googleapis.com secretmanager.googleapis.com

# יצירת חשבון השירות אם הוא לא קיים
if gcloud iam service-accounts describe "$SA_EMAIL" >/dev/null 2>&1; then
  echo "Service account $SA_NAME already exists."
else
  gcloud iam service-accounts create "$SA_NAME" --display-name="FocusFlow backend" >/dev/null
  echo "Created service account $SA_NAME."
fi

# הסוד mongo-url: כתובת Atlas עם הסיסמה
ensure_secret mongo-url
if ask_yes "Add a new version to mongo-url?"; then
  add_typed_version mongo-url || true  # || true – ערך ריק לא עוצר את הסקריפט
fi

# הסוד jwt-secret: אפשר ליצור אקראי או להקליד
ensure_secret jwt-secret
if ask_yes "Add a new version to jwt-secret?"; then
  if ask_yes "Generate a random value? (N = type it)"; then
    add_random_jwt_secret
  else
    add_typed_version jwt-secret || true
  fi
fi

# אופציונלי: נוצר רק אם הוקלד ערך
read -r -s -p "Gemini API key (hidden, Enter to skip): " gemini_key
echo
if [ -n "$gemini_key" ]; then  # -n = מחרוזת לא ריקה
  ensure_secret gemini-key
  printf '%s' "$gemini_key" | gcloud secrets versions add gemini-key --data-file=- >/dev/null
  echo "Added a new version to gemini-key."
fi
unset gemini_key

# הרשאה מינימלית: חשבון השירות מקבל רק הרשאת קריאה, ורק לסודות האלה (לא לכל הפרויקט)
for secret in mongo-url jwt-secret gemini-key; do
  if secret_exists "$secret"; then
    gcloud secrets add-iam-policy-binding "$secret" \
      --member="serviceAccount:$SA_EMAIL" \
      --role=roles/secretmanager.secretAccessor >/dev/null
    echo "$SA_NAME can read $secret."
  fi
done

echo "Done. Region for the next scripts: $REGION"

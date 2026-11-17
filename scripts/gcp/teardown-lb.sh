#!/usr/bin/env bash
# Delete the load balancer resources, in reverse order. Only for after the final grade:
# the site stops working on the domain.
#
# Usage: PROJECT_ID=<id> [REGION=me-west1] scripts/gcp/teardown-lb.sh
#
# מוחק את משאבי מאזן העומסים בסדר הפוך ליצירה. רק אחרי הציון הסופי – האתר מפסיק לעבוד בדומיין.

set -euo pipefail  # עצירה בכל שגיאה

: "${PROJECT_ID:?Set PROJECT_ID}"  # חובה
REGION="${REGION:-me-west1}"  # ברירת מחדל: אזור תל אביב
export CLOUDSDK_CORE_PROJECT="$PROJECT_ID"  # כל פקודות gcloud למטה יפעלו על הפרויקט הזה

# אישור מפורש לפני מחיקה: צריך להקליד DELETE. -r: בלי פענוח \ ; -p: טקסט השאלה
read -r -p "This deletes the load balancer of project $PROJECT_ID and the site goes offline. Type DELETE to continue: " answer
if [ "$answer" != "DELETE" ]; then
  echo "Nothing was deleted."
  exit 0
fi

# ממשיכה גם אם משהו כבר נמחק קודם
remove() {
  echo "Deleting: $*"  # $* = כל הפרמטרים כטקסט אחד
  "$@" --quiet || echo "  (not deleted, maybe it does not exist)"  # "$@" מריץ את הפקודה שהועברה; --quiet = בלי שאלות
}

# סדר הפוך ליצירה: כל משאב נמחק אחרי מי שמשתמש בו
remove gcloud compute forwarding-rules delete ff-https-rule --global  # כלל ההעברה על פורט 443
remove gcloud compute target-https-proxies delete ff-https-proxy --global  # ה-proxy של HTTPS
remove gcloud compute ssl-certificates delete ff-cert --global  # התעודה
remove gcloud compute url-maps delete ff-urlmap --global  # מפת הנתיבים
remove gcloud compute backend-services delete ff-backend-bs --global  # שירות ה-backend של השרת
remove gcloud compute backend-services delete ff-frontend-bs --global  # ושל הלקוח
remove gcloud compute network-endpoint-groups delete ff-backend-neg --region="$REGION"  # קבוצות הקצה (NEG) ל-Cloud Run
remove gcloud compute network-endpoint-groups delete ff-frontend-neg --region="$REGION"
remove gcloud compute addresses delete ff-ip --global  # כתובת ה-IP הקבועה

echo "Done."

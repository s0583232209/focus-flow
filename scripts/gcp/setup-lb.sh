#!/usr/bin/env bash
# Global external Application Load Balancer in front of Cloud Run. Safe to run again:
# anything that already exists is skipped.
#
# Usage: PROJECT_ID=<id> DOMAIN=<host> [REGION=me-west1] scripts/gcp/setup-lb.sh
#
# יוצר מאזן עומסים גלובלי עם HTTPS לפני Cloud Run. בטוח להריץ שוב: מה שכבר קיים – מדלגים עליו.
# בלי HTTPS הדפדפן לא מאפשר מצלמה, ולכן זה חלק מהליבה.

set -euo pipefail  # עצירה בכל שגיאה

: "${PROJECT_ID:?Set PROJECT_ID}"  # חובה
: "${DOMAIN:?Set DOMAIN (host name only, for example focus.ddns.net)}"  # חובה: שם הדומיין בלבד
REGION="${REGION:-me-west1}"
export CLOUDSDK_CORE_PROJECT="$PROJECT_ID"

# create_once <description> <describe command...> -- <create command...>
# מריץ את פקודת ה-describe; אם המשאב קיים – מדלג, ואם לא – מריץ את פקודת ה-create.
# שתי הפקודות מופרדות ב-"--"
create_once() {
  local what="$1"  # תיאור לתצוגה
  shift
  local describe=()  # מערך שיחזיק את פקודת ה-describe
  while [ "$1" != "--" ]; do  # אוספים מילים עד המפריד
    describe+=("$1")
    shift
  done
  shift  # מדלגים על ה-"--"; מה שנשאר ב-"$@" הוא פקודת ה-create
  if "${describe[@]}" >/dev/null 2>&1; then
    echo "Exists: $what"
  else
    echo "Creating: $what"
    "$@"
  fi
}

# 1. Static IP
# כתובת IP קבועה – אליה תצביע רשומת ה-DNS
create_once "global IP ff-ip" \
  gcloud compute addresses describe ff-ip --global -- \
  gcloud compute addresses create ff-ip --global
IP="$(gcloud compute addresses describe ff-ip --global --format='value(address)')"
echo "IP: $IP"

# 2. Serverless NEGs + 3. backend services. Serverless NEGs have no health checks.
# לכל שירות (שרת ולקוח): NEG = "קבוצת קצה" שמצביעה על שירות Cloud Run,
# ו-backend service שמאזן העומסים שולח אליו בקשות. ל-NEG מסוג serverless אין בדיקות תקינות
for name in backend frontend; do
  create_once "NEG ff-$name-neg" \
    gcloud compute network-endpoint-groups describe "ff-$name-neg" --region="$REGION" -- \
    gcloud compute network-endpoint-groups create "ff-$name-neg" \
    --region="$REGION" \
    --network-endpoint-type=serverless \
    --cloud-run-service="ff-$name"

  create_once "backend service ff-$name-bs" \
    gcloud compute backend-services describe "ff-$name-bs" --global -- \
    gcloud compute backend-services create "ff-$name-bs" \
    --global \
    --load-balancing-scheme=EXTERNAL_MANAGED

  # מחברים את ה-NEG ל-backend service, אם עוד לא מחובר
  attached="$(gcloud compute backend-services describe "ff-$name-bs" --global --format='value(backends[].group)')"
  # == *טקסט* = בדיקה אם המחרוזת מכילה את הטקסט
  if [[ "$attached" == *"ff-$name-neg"* ]]; then
    echo "Exists: ff-$name-neg in ff-$name-bs"
  else
    echo "Adding: ff-$name-neg to ff-$name-bs"
    gcloud compute backend-services add-backend "ff-$name-bs" \
      --global \
      --network-endpoint-group="ff-$name-neg" \
      --network-endpoint-group-region="$REGION"
  fi
done

# 4. URL map: /api/* and /health go to the backend, everything else to the frontend.
# מפת נתיבים: /api/* ו-/health לשרת, כל השאר ללקוח
create_once "URL map ff-urlmap" \
  gcloud compute url-maps describe ff-urlmap -- \
  gcloud compute url-maps create ff-urlmap --default-service=ff-frontend-bs

# כללי הנתיבים עצמם (path matcher) לדומיין שלנו
matchers="$(gcloud compute url-maps describe ff-urlmap --format='value(pathMatchers[].name)')"
if [[ "$matchers" == *"ff-paths"* ]]; then
  echo "Exists: path matcher ff-paths"
else
  echo "Adding: path matcher ff-paths for $DOMAIN"
  gcloud compute url-maps add-path-matcher ff-urlmap \
    --path-matcher-name=ff-paths \
    --default-service=ff-frontend-bs \
    --backend-service-path-rules="/api/*=ff-backend-bs,/health=ff-backend-bs" \
    --new-hosts="$DOMAIN"
fi

# 5. Managed certificate
# תעודת SSL שגוגל מנפיקה ומחדשת לבד (יכולה להיות PROVISIONING עד שעה ויותר)
create_once "certificate ff-cert" \
  gcloud compute ssl-certificates describe ff-cert --global -- \
  gcloud compute ssl-certificates create ff-cert --domains="$DOMAIN" --global

# 6. HTTPS proxy and forwarding rule
# ה-proxy מחבר בין התעודה למפת הנתיבים
create_once "HTTPS proxy ff-https-proxy" \
  gcloud compute target-https-proxies describe ff-https-proxy --global -- \
  gcloud compute target-https-proxies create ff-https-proxy \
  --url-map=ff-urlmap \
  --ssl-certificates=ff-cert \
  --global

# כלל ההעברה: תעבורה לכתובת ה-IP בפורט 443 (HTTPS) עוברת ל-proxy
create_once "forwarding rule ff-https-rule" \
  gcloud compute forwarding-rules describe ff-https-rule --global -- \
  gcloud compute forwarding-rules create ff-https-rule \
  --load-balancing-scheme=EXTERNAL_MANAGED \
  --address=ff-ip \
  --target-https-proxy=ff-https-proxy \
  --global \
  --ports=443

# 7. What to do next
# מה לעשות עכשיו: רשומת A אחת ב-No-IP לכתובת הזו, ולעקוב אחרי מצב התעודה
echo
echo "Put one DNS A record for $DOMAIN, pointing only at: $IP"
echo "Watch the certificate (PROVISIONING can take an hour or more):"
echo "  gcloud compute ssl-certificates describe ff-cert --global --format=\"get(managed.status,managed.domainStatus)\""

#!/usr/bin/env bash
# Deploy the FocusFlow images to Cloud Run.
#
# Usage: PROJECT_ID=<id> DOCKER_USER=<user> DOMAIN=<host> [TAG=v1] [REGION=me-west1] \
#        scripts/gcp/deploy.sh [--grading] [--frontend-image <image>]
#   --grading                 keeps one backend instance warm (for the grading window)
#   --frontend-image <image>  deploys this frontend image instead of the one from TAG
#
# פריסת תמונות השרת והלקוח ל-Google Cloud Run.
# --grading משאיר מופע אחד של השרת דלוק תמיד (בלי "התחלה קרה") – לחלון הבדיקה.

set -euo pipefail  # עצירה בכל שגיאה

: "${PROJECT_ID:?Set PROJECT_ID}"  # שלושת המשתנים האלה חובה
: "${DOCKER_USER:?Set DOCKER_USER}"
: "${DOMAIN:?Set DOMAIN (host name only, for example focus.ddns.net)}"
REGION="${REGION:-me-west1}"  # ברירת מחדל: אזור תל אביב
TAG="${TAG:-$(git rev-parse --short HEAD)}"  # ברירת מחדל: ה-hash הקצר של ה-commit
export CLOUDSDK_CORE_PROJECT="$PROJECT_ID"  # כל פקודות gcloud יפעלו על הפרויקט הזה

MIN_INSTANCES=0  # ברירת מחדל: השרת "נרדם" כשאין בקשות (חוסך כסף)
FRONTEND_IMAGE="docker.io/$DOCKER_USER/focusflow-frontend:$TAG"
# קריאת הדגלים משורת הפקודה. $# = כמה פרמטרים נשארו; shift = מוריד את הראשון
while [ $# -gt 0 ]; do
  case "$1" in
    --grading)
      MIN_INSTANCES=1  # מופע אחד תמיד חם
      shift
      ;;
    --frontend-image)
      FRONTEND_IMAGE="${2:?--frontend-image needs a value}"  # הפרמטר שאחרי הדגל
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2  # דגל לא מוכר
      exit 2
      ;;
  esac
done

BACKEND_IMAGE="docker.io/$DOCKER_USER/focusflow-backend:$TAG"

# 1. Secrets are referenced by name: their values are never visible here.
# הסודות מוזכרים רק בשם (סוד:גרסה). Cloud Run מזריק את הערכים למשתני הסביבה בזמן ריצה
SECRETS="MONGO_URL=mongo-url:latest,JWT_SECRET=jwt-secret:latest"
# מפתח Gemini רק אם הסוד קיים
if gcloud secrets describe gemini-key >/dev/null 2>&1; then
  SECRETS="$SECRETS,GEMINI_API_KEY=gemini-key:latest"
fi

# 2. Backend
# פריסת השרת: התמונה, פורט 8000, גישה ציבורית, חשבון השירות (שיכול לקרוא את הסודות),
# משתני סביבה רגילים (CORS רק לדומיין שלנו), עד 3 מופעים ו-512MB זיכרון
gcloud run deploy ff-backend \
  --image="$BACKEND_IMAGE" \
  --region="$REGION" \
  --port=8000 \
  --allow-unauthenticated \
  --service-account="ff-backend-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --set-secrets="$SECRETS" \
  --set-env-vars="MONGO_DB=focusflow,JWT_EXPIRE_MINUTES=60,CORS_ORIGINS=https://$DOMAIN" \
  --min-instances="$MIN_INSTANCES" \
  --max-instances=3 \
  --memory=512Mi

# 3. Frontend. API_URL is empty on purpose: same domain, the load balancer routes /api/*.
# API_URL ריק בכוונה: הלקוח פונה לאותו דומיין, ומאזן העומסים מנתב את /api/* לשרת
# $1 = התמונה, $2 = הפורט
deploy_frontend() {
  gcloud run deploy ff-frontend \
    --image="$1" \
    --region="$REGION" \
    --port="$2" \
    --allow-unauthenticated \
    --set-env-vars="API_URL=" \
    --min-instances=0 \
    --max-instances=3 \
    --memory=256Mi
}

# אם תמונת הלקוח קיימת ב-Docker Hub – פורסים אותה
if docker manifest inspect "$FRONTEND_IMAGE" >/dev/null 2>&1; then
  deploy_frontend "$FRONTEND_IMAGE" 3000
# אם אין תמונה וגם עוד אין שירות ff-frontend – פורסים זמנית את תמונת השרת בשמו,
# כי מאזן העומסים צריך ששני השירותים יהיו קיימים
elif ! gcloud run services describe ff-frontend --region="$REGION" >/dev/null 2>&1; then
  echo "WARNING: $FRONTEND_IMAGE does not exist yet." >&2
  echo "WARNING: deploying the backend image as a TEMPORARY ff-frontend, so the load balancer can be created." >&2
  gcloud run deploy ff-frontend \
    --image="$BACKEND_IMAGE" \
    --region="$REGION" \
    --port=8000 \
    --allow-unauthenticated \
    --service-account="ff-backend-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --set-secrets="$SECRETS" \
    --set-env-vars="MONGO_DB=focusflow,JWT_EXPIRE_MINUTES=60,CORS_ORIGINS=https://$DOMAIN" \
    --min-instances=0 \
    --max-instances=3 \
    --memory=512Mi
# אחרת – משאירים את הגרסה הקיימת של הלקוח
else
  echo "$FRONTEND_IMAGE does not exist: keeping the current ff-frontend revision." >&2
fi

# 4. Result
# הכתובות של שני השירותים (כתובות run.app), ובדיקת /health של השרת
BACKEND_URL="$(gcloud run services describe ff-backend --region="$REGION" --format='value(status.url)')"
FRONTEND_URL="$(gcloud run services describe ff-frontend --region="$REGION" --format='value(status.url)')"
echo "ff-backend:  $BACKEND_URL"
echo "ff-frontend: $FRONTEND_URL"
echo "Backend health:"
curl -fsS "$BACKEND_URL/health"  # אם נכשל, set -e עוצר את הסקריפט
echo

# 5. Through the load balancer, once it exists.
# בדיקה דרך הדומיין (רק אם מאזן העומסים, ה-DNS והתעודה כבר מוכנים)
if curl -fsS --max-time 10 "https://$DOMAIN/health" -o /dev/null 2>/dev/null; then
  echo "https://$DOMAIN/health:"
  curl -fsS "https://$DOMAIN/health"
  echo
else
  echo "https://$DOMAIN/health is not answering yet (load balancer, DNS or certificate not ready)."
fi

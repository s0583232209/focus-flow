#!/usr/bin/env bash
# Deploy the FocusFlow images to Cloud Run.
#
# Usage: PROJECT_ID=<id> DOCKER_USER=<user> DOMAIN=<host> [TAG=v1] [REGION=me-west1] \
#        scripts/gcp/deploy.sh [--grading] [--frontend-image <image>]
#   --grading                 keeps one backend instance warm (for the grading window)
#   --frontend-image <image>  deploys this frontend image instead of the one from TAG
set -euo pipefail

: "${PROJECT_ID:?Set PROJECT_ID}"
: "${DOCKER_USER:?Set DOCKER_USER}"
: "${DOMAIN:?Set DOMAIN (host name only, for example focus.ddns.net)}"
REGION="${REGION:-me-west1}"
TAG="${TAG:-$(git rev-parse --short HEAD)}"
export CLOUDSDK_CORE_PROJECT="$PROJECT_ID"

MIN_INSTANCES=0
FRONTEND_IMAGE="docker.io/$DOCKER_USER/focusflow-frontend:$TAG"
while [ $# -gt 0 ]; do
  case "$1" in
    --grading)
      MIN_INSTANCES=1
      shift
      ;;
    --frontend-image)
      FRONTEND_IMAGE="${2:?--frontend-image needs a value}"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 2
      ;;
  esac
done

BACKEND_IMAGE="docker.io/$DOCKER_USER/focusflow-backend:$TAG"

# 1. Secrets are referenced by name: their values are never visible here.
SECRETS="MONGO_URL=mongo-url:latest,JWT_SECRET=jwt-secret:latest"
if gcloud secrets describe gemini-key >/dev/null 2>&1; then
  SECRETS="$SECRETS,GEMINI_API_KEY=gemini-key:latest"
fi

# 2. Backend
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

if docker manifest inspect "$FRONTEND_IMAGE" >/dev/null 2>&1; then
  deploy_frontend "$FRONTEND_IMAGE" 3000
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
else
  echo "$FRONTEND_IMAGE does not exist: keeping the current ff-frontend revision." >&2
fi

# 4. Result
BACKEND_URL="$(gcloud run services describe ff-backend --region="$REGION" --format='value(status.url)')"
FRONTEND_URL="$(gcloud run services describe ff-frontend --region="$REGION" --format='value(status.url)')"
echo "ff-backend:  $BACKEND_URL"
echo "ff-frontend: $FRONTEND_URL"
echo "Backend health:"
curl -fsS "$BACKEND_URL/health"
echo

# 5. Through the load balancer, once it exists.
if curl -fsS --max-time 10 "https://$DOMAIN/health" -o /dev/null 2>/dev/null; then
  echo "https://$DOMAIN/health:"
  curl -fsS "https://$DOMAIN/health"
  echo
else
  echo "https://$DOMAIN/health is not answering yet (load balancer, DNS or certificate not ready)."
fi

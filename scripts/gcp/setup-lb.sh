#!/usr/bin/env bash
# Global external Application Load Balancer in front of Cloud Run. Safe to run again:
# anything that already exists is skipped.
#
# Usage: PROJECT_ID=<id> DOMAIN=<host> [REGION=me-west1] scripts/gcp/setup-lb.sh
set -euo pipefail

: "${PROJECT_ID:?Set PROJECT_ID}"
: "${DOMAIN:?Set DOMAIN (host name only, for example focus.ddns.net)}"
REGION="${REGION:-me-west1}"
export CLOUDSDK_CORE_PROJECT="$PROJECT_ID"

# create_once <description> <describe command...> -- <create command...>
create_once() {
  local what="$1"
  shift
  local describe=()
  while [ "$1" != "--" ]; do
    describe+=("$1")
    shift
  done
  shift
  if "${describe[@]}" >/dev/null 2>&1; then
    echo "Exists: $what"
  else
    echo "Creating: $what"
    "$@"
  fi
}

# 1. Static IP
create_once "global IP ff-ip" \
  gcloud compute addresses describe ff-ip --global -- \
  gcloud compute addresses create ff-ip --global
IP="$(gcloud compute addresses describe ff-ip --global --format='value(address)')"
echo "IP: $IP"

# 2. Serverless NEGs + 3. backend services. Serverless NEGs have no health checks.
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

  attached="$(gcloud compute backend-services describe "ff-$name-bs" --global --format='value(backends[].group)')"
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
create_once "URL map ff-urlmap" \
  gcloud compute url-maps describe ff-urlmap -- \
  gcloud compute url-maps create ff-urlmap --default-service=ff-frontend-bs

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
create_once "certificate ff-cert" \
  gcloud compute ssl-certificates describe ff-cert --global -- \
  gcloud compute ssl-certificates create ff-cert --domains="$DOMAIN" --global

# 6. HTTPS proxy and forwarding rule
create_once "HTTPS proxy ff-https-proxy" \
  gcloud compute target-https-proxies describe ff-https-proxy --global -- \
  gcloud compute target-https-proxies create ff-https-proxy \
  --url-map=ff-urlmap \
  --ssl-certificates=ff-cert \
  --global

create_once "forwarding rule ff-https-rule" \
  gcloud compute forwarding-rules describe ff-https-rule --global -- \
  gcloud compute forwarding-rules create ff-https-rule \
  --load-balancing-scheme=EXTERNAL_MANAGED \
  --address=ff-ip \
  --target-https-proxy=ff-https-proxy \
  --global \
  --ports=443

# 7. What to do next
echo
echo "Put one DNS A record for $DOMAIN, pointing only at: $IP"
echo "Watch the certificate (PROVISIONING can take an hour or more):"
echo "  gcloud compute ssl-certificates describe ff-cert --global --format=\"get(managed.status,managed.domainStatus)\""

#!/usr/bin/env bash
# Delete the load balancer resources, in reverse order. Only for after the final grade:
# the site stops working on the domain.
#
# Usage: PROJECT_ID=<id> [REGION=me-west1] scripts/gcp/teardown-lb.sh
set -euo pipefail

: "${PROJECT_ID:?Set PROJECT_ID}"
REGION="${REGION:-me-west1}"
export CLOUDSDK_CORE_PROJECT="$PROJECT_ID"

read -r -p "This deletes the load balancer of project $PROJECT_ID and the site goes offline. Type DELETE to continue: " answer
if [ "$answer" != "DELETE" ]; then
  echo "Nothing was deleted."
  exit 0
fi

# Keeps going if something is already gone.
remove() {
  echo "Deleting: $*"
  "$@" --quiet || echo "  (not deleted, maybe it does not exist)"
}

remove gcloud compute forwarding-rules delete ff-https-rule --global
remove gcloud compute target-https-proxies delete ff-https-proxy --global
remove gcloud compute ssl-certificates delete ff-cert --global
remove gcloud compute url-maps delete ff-urlmap --global
remove gcloud compute backend-services delete ff-backend-bs --global
remove gcloud compute backend-services delete ff-frontend-bs --global
remove gcloud compute network-endpoint-groups delete ff-backend-neg --region="$REGION"
remove gcloud compute network-endpoint-groups delete ff-frontend-neg --region="$REGION"
remove gcloud compute addresses delete ff-ip --global

echo "Done."

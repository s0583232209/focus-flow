#!/usr/bin/env bash
# Create the backend service account and the secrets in Secret Manager.
# Values are read with hidden typing and piped to gcloud: they are never an argument,
# never echoed, and never stored in shell history or in a file.
#
# Usage: PROJECT_ID=<id> [REGION=me-west1] scripts/gcp/setup-secrets.sh
set -euo pipefail

: "${PROJECT_ID:?Set PROJECT_ID}"
REGION="${REGION:-me-west1}"
export CLOUDSDK_CORE_PROJECT="$PROJECT_ID"

SA_NAME="ff-backend-sa"
SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

secret_exists() {
  gcloud secrets describe "$1" >/dev/null 2>&1
}

ensure_secret() {
  if secret_exists "$1"; then
    echo "Secret $1 already exists."
  else
    gcloud secrets create "$1" --replication-policy=automatic >/dev/null
    echo "Created secret $1."
  fi
}

ask_yes() {
  local answer
  read -r -p "$1 [y/N] " answer
  [ "$answer" = "y" ] || [ "$answer" = "Y" ]
}

add_typed_version() {
  local value
  read -r -s -p "Value for $1 (hidden): " value
  echo
  if [ -z "$value" ]; then
    echo "Empty value: nothing added to $1."
    return 1
  fi
  printf '%s' "$value" | gcloud secrets versions add "$1" --data-file=- >/dev/null
  unset value
  echo "Added a new version to $1."
}

add_random_jwt_secret() {
  # No python needed, so it also works in Git Bash on Windows.
  head -c 48 /dev/urandom | base64 | tr -d '\n=+/' |
    gcloud secrets versions add jwt-secret --data-file=- >/dev/null
  echo "Added a generated value to jwt-secret."
}

echo "Enabling APIs..."
gcloud services enable run.googleapis.com compute.googleapis.com secretmanager.googleapis.com

if gcloud iam service-accounts describe "$SA_EMAIL" >/dev/null 2>&1; then
  echo "Service account $SA_NAME already exists."
else
  gcloud iam service-accounts create "$SA_NAME" --display-name="FocusFlow backend" >/dev/null
  echo "Created service account $SA_NAME."
fi

ensure_secret mongo-url
if ask_yes "Add a new version to mongo-url?"; then
  add_typed_version mongo-url || true
fi

ensure_secret jwt-secret
if ask_yes "Add a new version to jwt-secret?"; then
  if ask_yes "Generate a random value? (N = type it)"; then
    add_random_jwt_secret
  else
    add_typed_version jwt-secret || true
  fi
fi

# Optional: created only if a value is typed.
read -r -s -p "Gemini API key (hidden, Enter to skip): " gemini_key
echo
if [ -n "$gemini_key" ]; then
  ensure_secret gemini-key
  printf '%s' "$gemini_key" | gcloud secrets versions add gemini-key --data-file=- >/dev/null
  echo "Added a new version to gemini-key."
fi
unset gemini_key

for secret in mongo-url jwt-secret gemini-key; do
  if secret_exists "$secret"; then
    gcloud secrets add-iam-policy-binding "$secret" \
      --member="serviceAccount:$SA_EMAIL" \
      --role=roles/secretmanager.secretAccessor >/dev/null
    echo "$SA_NAME can read $secret."
  fi
done

echo "Done. Region for the next scripts: $REGION"

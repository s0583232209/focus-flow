#!/usr/bin/env bash
# For a machine behind a TLS-filtering network (NetFree and similar) only.
# Builds local base images that trust the filter's certificates, so pip and npm work
# during image builds. Nothing here changes the Dockerfiles or goes to Docker Hub.
#
# Usage: CA_BUNDLE=<all CAs, .pem/.crt> [CA_LIST=<filter CAs only>] scripts/local-ca-base-images.sh
# On a NetFree machine:
#   CA_BUNDLE=/c/ProgramData/NetFree/CA/netfree-ca-bundle-curl.crt \
#   CA_LIST=/c/ProgramData/NetFree/CA/netfree-ca-list.crt scripts/local-ca-base-images.sh
#
# רק למחשב מאחורי סינון שמפענח TLS (כמו נטפרי). הסינון מחליף את תעודות האבטחה של אתרים,
# ולכן pip ו-npm בתוך בניית התמונה נכשלים. הסקריפט בונה תמונות בסיס מקומיות שסומכות על
# תעודות הסינון. הוא לא משנה את ה-Dockerfiles ולא מעלה כלום ל-Docker Hub.

set -euo pipefail  # עצירה בכל שגיאה

: "${CA_BUNDLE:?Set CA_BUNDLE to a file with all trusted CAs}"  # חובה: קובץ עם כל התעודות
CA_LIST="${CA_LIST:-$CA_BUNDLE}"  # אם לא הוגדר – אותו קובץ

build_dir="$(mktemp -d)"  # תיקייה זמנית לבנייה
trap 'rm -rf "$build_dir"' EXIT  # trap: כשהסקריפט נגמר (גם בשגיאה) – מוחקים את התיקייה
cp "$CA_BUNDLE" "$build_dir/bundle.pem"  # מעתיקים את התעודות לתיקיית הבנייה
cp "$CA_LIST" "$build_dir/list.pem"

# תמונת פייתון שבה pip משתמש בקובץ התעודות שלנו. ה-Dockerfile מועבר דרך stdin (-f -)
docker build -q -t ff-local/python-ca:3.12 -f - "$build_dir" <<'EOF'
FROM python:3.12-slim
COPY bundle.pem /etc/ff-ca-bundle.pem
ENV PIP_CERT=/etc/ff-ca-bundle.pem
EOF

# תמונת Node שבה npm סומך גם על תעודות הסינון (NODE_EXTRA_CA_CERTS מוסיף, לא מחליף)
docker build -q -t ff-local/node-ca:20 -f - "$build_dir" <<'EOF'
FROM node:20-alpine
COPY list.pem /etc/ff-ca-list.pem
ENV NODE_EXTRA_CA_CERTS=/etc/ff-ca-list.pem
EOF

# הדפסת הוראות: קובץ compose אישי שגורם לבנייה להשתמש בתמונות הבסיס המקומיות
# (additional_contexts מחליף את "FROM python:3.12-slim" בתמונה שלנו בלי לגעת ב-Dockerfile)
cat <<'EOF'
Done. To build with them, save this as docker-compose.local.yml (git ignores it):

services:
  backend:
    build:
      context: ./backend
      additional_contexts:
        "python:3.12-slim": "docker-image://ff-local/python-ca:3.12"
  frontend:
    build:
      context: ./frontend
      additional_contexts:
        "node:20-alpine": "docker-image://ff-local/node-ca:20"

and run:
  docker compose -f docker-compose.dev.yml -f docker-compose.local.yml up --build
EOF

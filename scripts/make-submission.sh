#!/usr/bin/env bash
# Build submission/assignment3.zip: docker-compose.yml, .env and PROJECT_INFO.docx at the
# top level (plus extension/ if it exists). A new one-time JWT_SECRET on every run.
#
# Usage: DOCKER_USER=<docker hub user> scripts/make-submission.sh
set -euo pipefail

: "${DOCKER_USER:?Set DOCKER_USER to the Docker Hub user that holds the v1 images}"
cd "$(git rev-parse --show-toplevel)"

if [ ! -f docs/PROJECT_INFO.docx ]; then
  echo "docs/PROJECT_INFO.docx is missing: fill in the original template first." >&2
  exit 1
fi

# The first Python that really runs (on Windows "python3" can be a Store shortcut).
find_python() {
  local candidate
  for candidate in python3 python "py -3"; do
    if $candidate -c "import sys" >/dev/null 2>&1; then
      echo "$candidate"
      return 0
    fi
  done
  echo "Python is required to build the zip." >&2
  return 1
}
PYTHON="$(find_python)"

jwt_secret="$(head -c 48 /dev/urandom | base64 | tr -d '\n=+/')"

# Always LF endings: a stray CR would become part of a value.
tr -d '\r' <submission/.env.template |
  sed -e "s|^JWT_SECRET=.*|JWT_SECRET=$jwt_secret|" \
    -e "s|^DOCKER_USER=.*|DOCKER_USER=$DOCKER_USER|" >submission/.env

# shellcheck disable=SC2086
$PYTHON - <<'PY'
import os
import zipfile

out = "submission/assignment3.zip"
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    z.write("docker-compose.yml", "docker-compose.yml")
    z.write("submission/.env", ".env")
    z.write("docs/PROJECT_INFO.docx", "PROJECT_INFO.docx")
    for root, _dirs, files in os.walk("extension"):
        for name in files:
            path = os.path.join(root, name)
            z.write(path, path.replace(os.sep, "/"))

with zipfile.ZipFile(out) as z:
    print(out)
    for info in z.infolist():
        print(f"{info.file_size:>10}  {info.filename}")
PY

#!/usr/bin/env bash
# Run the submission the way the grader does: only docker-compose.yml and .env in an empty folder.
# Run scripts/make-submission.sh first. Ports 3000 and 8000 must be free.
#
# Usage: scripts/test-clean-run.sh [--teardown]
#   --teardown  stops the containers and deletes the test data at the end
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

if [ ! -f submission/.env ]; then
  echo "submission/.env is missing: run scripts/make-submission.sh first." >&2
  exit 1
fi

work_dir="$(mktemp -d)"
cp docker-compose.yml "$work_dir/docker-compose.yml"
cp submission/.env "$work_dir/.env"
cd "$work_dir"

docker compose down -v --remove-orphans >/dev/null 2>&1 || true
docker compose up -d

wait_for() {
  local url="$1"
  local attempt
  for attempt in $(seq 1 60); do
    if curl -fsS --max-time 3 "$url" -o /dev/null 2>/dev/null; then
      echo "OK   $url (after about $((attempt * 2)) s)"
      return 0
    fi
    sleep 2
  done
  echo "FAIL $url" >&2
  return 1
}

status=0
wait_for http://localhost:8000/health || status=1
wait_for http://localhost:3000 || status=1

if [ "${1:-}" = "--teardown" ]; then
  docker compose down -v
  rm -rf "$work_dir"
else
  echo "Running from $work_dir. To stop it: cd \"$work_dir\" && docker compose down -v"
fi
exit "$status"

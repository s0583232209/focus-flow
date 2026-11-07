#!/usr/bin/env bash
# Build the FocusFlow images for linux/amd64 and push them to Docker Hub.
#
# The Docker Hub repositories must be PUBLIC (the grader pulls them with no login),
# and the images must never contain secrets.
#
# Usage: DOCKER_USER=<user> [TAG=v1] scripts/build-and-push.sh
# Default TAG is the short git hash.
set -euo pipefail

: "${DOCKER_USER:?Set DOCKER_USER to your Docker Hub username}"
TAG="${TAG:-$(git rev-parse --short HEAD)}"

cd "$(git rev-parse --show-toplevel)"

pushed=()
for name in backend frontend; do
  if [ ! -f "$name/Dockerfile" ]; then
    echo "Skipping $name: $name/Dockerfile does not exist yet."
    continue
  fi
  image="$DOCKER_USER/focusflow-$name:$TAG"
  # EXTRA_BUILD_ARGS is for a local network that needs its own base images, see scripts/README.md.
  # shellcheck disable=SC2086
  docker buildx build --platform linux/amd64 ${EXTRA_BUILD_ARGS:-} -t "$image" --push "./$name"
  pushed+=("$image")
done

echo
echo "Pushed:"
printf '  %s\n' "${pushed[@]}"

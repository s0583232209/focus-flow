# Scripts

## Build and secrets

- `build-and-push.sh`: builds the backend and frontend images for `linux/amd64` and pushes them to Docker Hub. Needs `DOCKER_USER`; `TAG` defaults to the short git hash. The repositories must be public, and no image may contain a secret.
- `gcp/setup-secrets.sh`: enables the APIs, creates the service account `ff-backend-sa` and the secrets `mongo-url` and `jwt-secret` (`gemini-key` only if you type a value), and lets that account read them and nothing else. Values are typed hidden and piped to gcloud, so they never reach the shell history or a file. Safe to run again: answer N to keep the current values.

## Behind a TLS-filtering network (NetFree and similar)

Inside a container `pip` and `npm` do not trust the filter's certificate, so the image build fails with `CERTIFICATE_VERIFY_FAILED`. Do not change the Dockerfiles. `local-ca-base-images.sh` builds local base images that hold the CA (its comment shows the NetFree paths) and prints a compose override for local runs. To push images, swap them in at build time:

```bash
EXTRA_BUILD_ARGS="--build-context python:3.12-slim=docker-image://ff-local/python-ca:3.12 --build-context node:20-alpine=docker-image://ff-local/node-ca:20" \
  DOCKER_USER=<user> scripts/build-and-push.sh
```

An image built this way carries the filter's public CA in its base layer. That is not a secret, but it is cleaner to build the final `v1` images on another network.

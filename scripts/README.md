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

## Order for the cloud

1. `scripts/build-and-push.sh`
2. `scripts/gcp/setup-secrets.sh`
3. `scripts/gcp/deploy.sh`: both services must exist before the load balancer. If there is no frontend image yet, it deploys a temporary placeholder and warns you.
4. `scripts/gcp/setup-lb.sh`: prints the IP for the DNS record and the command that watches the certificate.
5. After the final grade only: `scripts/gcp/teardown-lb.sh` (asks you to type DELETE).

## Certificate status

- `PROVISIONING`: normal, it can take an hour or more. It starts only after the DNS record points at the load balancer IP.
- `FAILED_NOT_VISIBLE`: Google cannot see the domain on the load balancer. Check that the host has exactly one A record, with the `ff-ip` address, and wait. It tries again by itself.
- `ACTIVE`: ready. `https://<host>/health` should answer 200 with no warning.

## No-IP

A free No-IP host must be confirmed every 30 days, or it stops resolving. Check the expiry date before the grading window starts, and read their reminder emails.

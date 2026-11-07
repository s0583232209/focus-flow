#!/bin/sh
# Runs at container start (nginx image: /docker-entrypoint.d/).
# "-" without ":" keeps an EMPTY value empty: in the cloud API_URL="" means same-origin.
cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = { API_URL: "${API_URL-http://localhost:8000}" };
EOF

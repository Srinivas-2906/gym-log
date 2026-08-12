#!/usr/bin/env bash
# Wire gym-log Cloud Run into the shared kaana.in HTTPS load balancer.
# Run once after the first Cloud Build deploy.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-kaana-prod}"
REGION="${REGION:-asia-south1}"
SERVICE="${GYM_LOG_SERVICE:-gym-log}"
NEG="${GYM_LOG_NEG:-gym-log-neg}"
BACKEND="${GYM_LOG_BACKEND:-gym-log-backend}"
PATH_MATCHER="${GYM_LOG_PATH_MATCHER:-gym-log}"
HOST="${GYM_LOG_HOST:-gym-log.kaana.in}"
URL_MAP="${URL_MAP:-kaana-web-map-multi}"

echo "==> Project: $PROJECT_ID  Region: $REGION  Service: $SERVICE"
gcloud config set project "$PROJECT_ID"

echo "==> Ensure Cloud Run service exists"
gcloud run services describe "$SERVICE" --region "$REGION" >/dev/null

echo "==> Serverless NEG: $NEG"
if ! gcloud compute network-endpoint-groups describe "$NEG" --region="$REGION" >/dev/null 2>&1; then
  gcloud compute network-endpoint-groups create "$NEG" \
    --region="$REGION" \
    --network-endpoint-type=serverless \
    --cloud-run-service="$SERVICE"
else
  echo "   (exists)"
fi

echo "==> Backend service: $BACKEND"
if ! gcloud compute backend-services describe "$BACKEND" --global >/dev/null 2>&1; then
  gcloud compute backend-services create "$BACKEND" \
    --global \
    --load-balancing-scheme=EXTERNAL_MANAGED
fi

gcloud compute backend-services remove-backend "$BACKEND" \
  --global \
  --network-endpoint-group="$NEG" \
  --network-endpoint-group-region="$REGION" 2>/dev/null || true

gcloud compute backend-services add-backend "$BACKEND" \
  --global \
  --network-endpoint-group="$NEG" \
  --network-endpoint-group-region="$REGION"

echo "==> URL map path matcher: $PATH_MATCHER"
if ! gcloud compute url-maps describe "$URL_MAP" --global --format='yaml' | grep -q "name: $PATH_MATCHER"; then
  gcloud compute url-maps add-path-matcher "$URL_MAP" \
    --path-matcher-name="$PATH_MATCHER" \
    --default-service="$BACKEND" \
    --global
else
  echo "   (path matcher exists)"
fi

echo "==> Host rule: $HOST → $PATH_MATCHER"
if ! gcloud compute url-maps describe "$URL_MAP" --global --format='yaml' | grep -q "$HOST"; then
  gcloud compute url-maps add-host-rule "$URL_MAP" \
    --hosts="$HOST" \
    --path-matcher-name="$PATH_MATCHER" \
    --global
else
  echo "   (host rule exists)"
fi

LB_IP="$(gcloud compute forwarding-rules list --global --format='value(IPAddress)' | head -1)"
echo ""
echo "==> DNS (Hostinger): add this record for $HOST"
echo "    Type: A"
echo "    Name: gym-log"
echo "    Value: ${LB_IP:-<load-balancer-ip>}"
echo ""
echo "    Or if using a subdomain under kaana.in:"
echo "    Host: gym-log.kaana.in  →  A  →  ${LB_IP:-<load-balancer-ip>}"
echo ""
echo "Done."

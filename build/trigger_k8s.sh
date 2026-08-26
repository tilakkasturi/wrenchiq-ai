#!/usr/bin/env bash
set -euo pipefail

# Triggers the appropriate custom pipeline in k8s-configs repo based on environment.
#
# Usage:
#   bash build/trigger_k8s.sh <environment>
#   e.g. bash build/trigger_k8s.sh DEV
#
# Only ARTIFACT_TAG is sent — k8s-configs' own pipeline fetches this repo
# itself to compute the commit log (previous tag..ARTIFACT_TAG), rather than
# this script doing it. Keeps this script git-free: no local git dependency,
# no fetch/auth to worry about here.
#
# Required environment variables (set as Bitbucket repository secrets):
#   BB_API_TOKEN           — Access Token scoped to the workspace, with
#                            pipelines:write scope (to trigger k8s-configs).
#                            Sent as a Bearer token — Bitbucket Access Tokens
#                            use Bearer auth for the API, not Basic auth.
#   BITBUCKET_TAG          — set automatically by Bitbucket on tag pipelines

ENVIRONMENT=${1:?Usage: trigger_k8s.sh <DEV|UAT|PROD>}
ARTIFACT_TAG="${BITBUCKET_TAG:?BITBUCKET_TAG not set}"

case "$ENVIRONMENT" in
  DEV)   BRANCH="Development"; PIPELINE="build-and-deploy-dev-wrenchiq" ;;
  UAT)   BRANCH="Staging"; PIPELINE="deploy-uat-wrenchiq" ;;
  PROD)  BRANCH="master"; PIPELINE="deploy-prod-wrenchiq" ;;
  *)    echo "ERROR: Unknown environment '${ENVIRONMENT}' — must be DEV, UAT or PROD"; exit 1 ;;
esac

echo ">>> Triggering ${PIPELINE} in k8s-configs"
echo "    branch       : ${BRANCH}"
echo "    environment  : ${ENVIRONMENT}"
echo "    ARTIFACT_TAG : ${ARTIFACT_TAG}"

# ── Build the request body with jq ────────────────────────────────────────────
# Passed via --arg so jq handles JSON-escaping, rather than interpolating raw
# text into a hand-written JSON string (unsafe/fragile).
if ! command -v jq &>/dev/null; then
  echo ">>> Installing jq"
  (apt-get update -qq && apt-get install -y -qq jq) 2>/dev/null \
    || apk add --no-cache jq 2>/dev/null \
    || tdnf install -y jq 2>/dev/null \
    || true
fi

REQUEST_BODY=$(jq -n \
  --arg branch "$BRANCH" \
  --arg pipeline "$PIPELINE" \
  --arg artifact_tag "$ARTIFACT_TAG" \
  '{
    target: {
      type: "pipeline_ref_target",
      ref_type: "branch",
      ref_name: $branch,
      selector: {
        type: "custom",
        pattern: $pipeline
      }
    },
    variables: [
      {key: "ARTIFACT_TAG", value: $artifact_tag}
    ]
  }')

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: Bearer ${BB_API_TOKEN}" \
  -H "Content-Type: application/json" \
  "https://api.bitbucket.org/2.0/repositories/predii/k8s-configs/pipelines/" \
  -d "$REQUEST_BODY")

HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_STATUS" != "201" ]; then
  echo "ERROR: Pipeline '${PIPELINE}' trigger failed with HTTP ${HTTP_STATUS}"
  echo "$BODY"
  exit 1
fi

echo ">>> k8s-configs ${PIPELINE} triggered successfully (HTTP 201)"

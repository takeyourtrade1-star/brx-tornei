#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-eu-south-1}"
STAGING_PROJECT="${TOURNAMENTS_STAGING_PROJECT:-tournaments-staging}"
STAFF_SSM_PREFIX="${STAFF_STAGING_SSM_PREFIX:-/staging/ebartex/staff}"
TOURNAMENTS_SSM_PREFIX="${TOURNAMENTS_STAGING_SSM_PREFIX:-/${STAGING_PROJECT}}"

: "${EXPECTED_STAGING_AWS_ACCOUNT_ID:?required}"
: "${TOURNAMENTS_STAGING_BACKEND_BUCKET:?required}"
: "${TOURNAMENTS_STAGING_BACKEND_KEY:?required}"

if [[ ! "$EXPECTED_STAGING_AWS_ACCOUNT_ID" =~ ^[0-9]{12}$ ]]; then
  echo "Invalid expected staging AWS account ID" >&2
  exit 1
fi
if [[ "$STAGING_PROJECT" != "tournaments-staging" ]]; then
  echo "Staging project must be exactly tournaments-staging" >&2
  exit 1
fi
if [[ "$TOURNAMENTS_STAGING_BACKEND_KEY" == "tournaments/terraform.tfstate" ]]; then
  echo "Production Terraform state key is forbidden" >&2
  exit 1
fi
if [[ "$TOURNAMENTS_STAGING_BACKEND_BUCKET" == "ebartex-tournaments-tfstate-000876600482" ]]; then
  echo "Production Terraform state bucket is forbidden" >&2
  exit 1
fi

for binary in aws jq; do
  command -v "$binary" >/dev/null 2>&1 || {
    echo "Missing required binary: $binary" >&2
    exit 1
  }
done

ACTUAL_ACCOUNT_ID="$(AWS_PAGER='' aws sts get-caller-identity \
  --region "$AWS_REGION" --query Account --output text)"
if [[ "$ACTUAL_ACCOUNT_ID" != "$EXPECTED_STAGING_AWS_ACCOUNT_ID" ]]; then
  echo "AWS account does not match the explicit staging account" >&2
  exit 1
fi

AWS_PAGER='' aws s3api head-bucket \
  --region "$AWS_REGION" \
  --bucket "$TOURNAMENTS_STAGING_BACKEND_BUCKET" >/dev/null
VERSIONING="$(AWS_PAGER='' aws s3api get-bucket-versioning \
  --region "$AWS_REGION" \
  --bucket "$TOURNAMENTS_STAGING_BACKEND_BUCKET" \
  --query Status --output text)"
if [[ "$VERSIONING" != "Enabled" ]]; then
  echo "Staging state bucket must have versioning enabled" >&2
  exit 1
fi
ENCRYPTION="$(AWS_PAGER='' aws s3api get-bucket-encryption \
  --region "$AWS_REGION" \
  --bucket "$TOURNAMENTS_STAGING_BACKEND_BUCKET" \
  --query 'ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm' \
  --output text)"
if [[ "$ENCRYPTION" != "aws:kms" ]]; then
  echo "Staging state bucket must use KMS encryption" >&2
  exit 1
fi
PUBLIC_BLOCK="$(AWS_PAGER='' aws s3api get-public-access-block \
  --region "$AWS_REGION" \
  --bucket "$TOURNAMENTS_STAGING_BACKEND_BUCKET" --output json)"
if ! jq -e '.PublicAccessBlockConfiguration | all(.[]; . == true)' \
  >/dev/null <<<"$PUBLIC_BLOCK"; then
  echo "Staging state bucket must block all public access" >&2
  exit 1
fi

require_parameter() {
  local name="$1"
  local expected_type="$2"
  local actual_type
  actual_type="$(AWS_PAGER='' aws ssm describe-parameters \
    --region "$AWS_REGION" \
    --parameter-filters "Key=Name,Option=Equals,Values=$name" \
    --query 'Parameters[0].Type' --output text)"
  if [[ "$actual_type" != "$expected_type" ]]; then
    echo "Missing or invalid staging parameter: $name" >&2
    exit 1
  fi
}

TOURNAMENTS_TOKEN_PATH="${TOURNAMENTS_SSM_PREFIX}/MATCH_GAP_STAFF_API_TOKEN"
STAFF_TOKEN_PATH="${STAFF_SSM_PREFIX}/tournament_api_token"
require_parameter "$TOURNAMENTS_TOKEN_PATH" "SecureString"
require_parameter "$STAFF_TOKEN_PATH" "SecureString"
for suffix in tournament_internal_origin tournament_allowed_hosts tournament_media_allowed_hosts; do
  require_parameter "${STAFF_SSM_PREFIX}/${suffix}" "String"
done

TOURNAMENTS_TOKEN="$(AWS_PAGER='' aws ssm get-parameter \
  --region "$AWS_REGION" --name "$TOURNAMENTS_TOKEN_PATH" \
  --with-decryption --query Parameter.Value --output text)"
STAFF_TOKEN="$(AWS_PAGER='' aws ssm get-parameter \
  --region "$AWS_REGION" --name "$STAFF_TOKEN_PATH" \
  --with-decryption --query Parameter.Value --output text)"
cleanup() {
  unset TOURNAMENTS_TOKEN STAFF_TOKEN
}
trap cleanup EXIT

if [[ ! "$TOURNAMENTS_TOKEN" =~ ^[A-Za-z0-9._~-]{32,512}$ ]]; then
  echo "Invalid Tournaments staging broker token" >&2
  exit 1
fi
if [[ "$TOURNAMENTS_TOKEN" != "$STAFF_TOKEN" ]]; then
  echo "Staff and Tournaments staging broker tokens do not match" >&2
  exit 1
fi

echo "Staging preflight passed; no infrastructure or parameter was modified."

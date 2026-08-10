#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-eu-south-1}"
STAGING_PROJECT="${TOURNAMENTS_STAGING_PROJECT:-tournaments-staging}"

: "${EXPECTED_STAGING_AWS_ACCOUNT_ID:?required}"
: "${TOURNAMENTS_STAGING_BACKEND_BUCKET:?required}"
: "${TOURNAMENTS_STAGING_BACKEND_KEY:?required}"
: "${MATCH_GAP_STAGING_BUCKET:?required}"
: "${MATCH_GAP_STAGING_ORIGIN:?required}"

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

# Il bucket applicativo deve essere già privato e a scadenza prima di accendere
# il flag. Questo sostituisce il vecchio broker Staff con controlli più stretti
# sul confine realmente usato dai due giocatori.
AWS_PAGER='' aws s3api head-bucket \
  --region "$AWS_REGION" --bucket "$MATCH_GAP_STAGING_BUCKET" >/dev/null
GAP_PUBLIC_BLOCK="$(AWS_PAGER='' aws s3api get-public-access-block \
  --region "$AWS_REGION" --bucket "$MATCH_GAP_STAGING_BUCKET" --output json)"
if ! jq -e '.PublicAccessBlockConfiguration | all(.[]; . == true)' \
  >/dev/null <<<"$GAP_PUBLIC_BLOCK"; then
  echo "Match-gap staging bucket must block all public access" >&2
  exit 1
fi
GAP_ENCRYPTION="$(AWS_PAGER='' aws s3api get-bucket-encryption \
  --region "$AWS_REGION" --bucket "$MATCH_GAP_STAGING_BUCKET" \
  --query 'ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm' \
  --output text)"
if [[ "$GAP_ENCRYPTION" != "AES256" && "$GAP_ENCRYPTION" != "aws:kms" ]]; then
  echo "Match-gap staging bucket must use server-side encryption" >&2
  exit 1
fi
GAP_LIFECYCLE="$(AWS_PAGER='' aws s3api get-bucket-lifecycle-configuration \
  --region "$AWS_REGION" --bucket "$MATCH_GAP_STAGING_BUCKET" --output json)"
if ! jq -e 'any(.Rules[]; .Status == "Enabled" and .Expiration.Days <= 3)' \
  >/dev/null <<<"$GAP_LIFECYCLE"; then
  echo "Match-gap staging bucket must expire objects within 3 days" >&2
  exit 1
fi
GAP_CORS="$(AWS_PAGER='' aws s3api get-bucket-cors \
  --region "$AWS_REGION" --bucket "$MATCH_GAP_STAGING_BUCKET" --output json)"
if ! jq -e --arg origin "$MATCH_GAP_STAGING_ORIGIN" \
  'any(.CORSRules[]; .AllowedOrigins == [$origin] and .AllowedMethods == ["POST"])' \
  >/dev/null <<<"$GAP_CORS"; then
  echo "Match-gap staging CORS must allow only POST from the exact frontend origin" >&2
  exit 1
fi

for obsolete_parameter in \
  "/${STAGING_PROJECT}/MATCH_GAP_STAFF_API_TOKEN" \
  "/staging/ebartex/staff/tournament_api_token" \
  "/staging/ebartex/staff/tournament_internal_origin" \
  "/staging/ebartex/staff/tournament_allowed_hosts" \
  "/staging/ebartex/staff/tournament_media_allowed_hosts"; do
  parameter_count="$(AWS_PAGER='' aws ssm describe-parameters \
    --region "$AWS_REGION" \
    --parameter-filters "Key=Name,Option=Equals,Values=$obsolete_parameter" \
    --query 'length(Parameters)' --output text)"
  if [[ "$parameter_count" != "0" ]]; then
    echo "Obsolete Staff tournament parameter must be removed: $obsolete_parameter" >&2
    exit 1
  fi
done

echo "Staging preflight passed; no infrastructure or parameter was modified."

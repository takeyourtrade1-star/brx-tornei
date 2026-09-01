#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
users_file="${USERS_FILE:-}"
results_dir="${LOAD_RESULTS_DIR:-${repo_dir}/artifacts/load-tests}"
k6_image="${K6_IMAGE:-grafana/k6:2.1.0}"
profile="${LOAD_PROFILE:-smoke}"
generator_count="${LOAD_GENERATOR_COUNT:-1}"
generator_index="${LOAD_GENERATOR_INDEX:-0}"
backend_url="${TOURNAMENTS_BASE_URL:-http://host.docker.internal:8000}"
frontend_url="${TOURNAMENTS_FRONTEND_URL:-http://host.docker.internal:3001}"
browser_origin="${BROWSER_ORIGIN:-${frontend_url}}"
auth_url="${AUTH_BASE_URL:-}"
if [[ -n "${TOURNAMENTS_WS_ORIGIN:-}" ]]; then
  ws_origin="${TOURNAMENTS_WS_ORIGIN}"
elif [[ "${backend_url}" == https://* ]]; then
  ws_origin="wss://${backend_url#https://}"
elif [[ "${backend_url}" == http://* ]]; then
  ws_origin="ws://${backend_url#http://}"
else
  echo "TOURNAMENTS_BASE_URL deve iniziare con http:// o https://." >&2
  exit 2
fi
run_id="${LOAD_RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"

if [[ -z "${users_file}" || ! -f "${users_file}" ]]; then
  echo "USERS_FILE deve indicare il JSON con identita distinte di test." >&2
  exit 2
fi

if ! [[ "${profile}" =~ ^[a-zA-Z0-9][a-zA-Z0-9_-]*$ ]]; then
  echo "LOAD_PROFILE contiene caratteri non consentiti." >&2
  exit 2
fi
if ! [[ "${run_id}" =~ ^[a-zA-Z0-9][a-zA-Z0-9_-]*$ ]]; then
  echo "LOAD_RUN_ID contiene caratteri non consentiti." >&2
  exit 2
fi

if ! [[ "${generator_count}" =~ ^[1-9][0-9]*$ ]] || ! [[ "${generator_index}" =~ ^[0-9]+$ ]]; then
  echo "LOAD_GENERATOR_COUNT/INDEX devono essere interi non negativi; COUNT deve essere >= 1." >&2
  exit 2
fi
if (( generator_index >= generator_count )); then
  echo "LOAD_GENERATOR_INDEX deve essere minore di LOAD_GENERATOR_COUNT." >&2
  exit 2
fi
if [[ -z "${auth_url}" ]]; then
  echo "AUTH_BASE_URL deve essere impostato esplicitamente (mai usare un Auth implicito)." >&2
  exit 2
fi

users_file="$(cd "$(dirname "${users_file}")" && pwd -P)/$(basename "${users_file}")"
results_dir="$(mkdir -p -- "${results_dir}" && cd -- "${results_dir}" && pwd -P)"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js e richiesto per validare il file delle identita prima del run." >&2
  exit 2
fi

node "${repo_dir}/scripts/validate-tournament-load-users.mjs" "${users_file}"

result_file="${LOAD_RESULT_FILE:-${profile}-${run_id}-generator-${generator_index}-of-${generator_count}-summary.json}"
if ! [[ "${result_file}" =~ ^[a-zA-Z0-9._-]+\.json$ ]]; then
  echo "LOAD_RESULT_FILE deve essere un nome file .json senza directory." >&2
  exit 2
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker e richiesto per eseguire il load test (immagine ${k6_image})." >&2
  exit 2
fi

docker run --rm \
  --volume "${repo_dir}/load-tests/k6:/scripts:ro" \
  --volume "${users_file}:/secrets/users.json:ro" \
  --volume "${results_dir}:/results" \
  --env USERS_FILE="/secrets/users.json" \
  --env LOAD_PROFILE="${profile}" \
  --env LOAD_STAGES="${LOAD_STAGES:-}" \
  --env LOAD_TEST_CONFIRM_HOST="${LOAD_TEST_CONFIRM_HOST:-}" \
  --env LOAD_TEST_CONFIRM_HOSTS="${LOAD_TEST_CONFIRM_HOSTS:-}" \
  --env TOURNAMENTS_BASE_URL="${backend_url}" \
  --env TOURNAMENTS_FRONTEND_URL="${frontend_url}" \
  --env TOURNAMENTS_WS_ORIGIN="${ws_origin}" \
  --env AUTH_BASE_URL="${auth_url}" \
  --env BROWSER_ORIGIN="${browser_origin}" \
  --env LOAD_GENERATOR_COUNT="${generator_count}" \
  --env LOAD_GENERATOR_INDEX="${generator_index}" \
  --env LOAD_PAIR_DELAY_SECONDS="${LOAD_PAIR_DELAY_SECONDS:-}" \
  --env LOAD_INCLUDE_FRONTEND="${LOAD_INCLUDE_FRONTEND:-true}" \
  --env LOAD_INCLUDE_BACKEND_READS="${LOAD_INCLUDE_BACKEND_READS:-}" \
  --env LOAD_INCLUDE_EVENTS_WS="${LOAD_INCLUDE_EVENTS_WS:-true}" \
  --env LOAD_INCLUDE_CHAT_WS="${LOAD_INCLUDE_CHAT_WS:-true}" \
  --env LOAD_INCLUDE_SIGNALING="${LOAD_INCLUDE_SIGNALING:-true}" \
  --env LOAD_INCLUDE_QUALITY="${LOAD_INCLUDE_QUALITY:-true}" \
  --env LOAD_SIGNALING_VIA_FRONTEND="${LOAD_SIGNALING_VIA_FRONTEND:-false}" \
  --env LOAD_COMPLETE_RESULTS="${LOAD_COMPLETE_RESULTS:-true}" \
  --env LOAD_CLEANUP_BEFORE="${LOAD_CLEANUP_BEFORE:-true}" \
  --env SUMMARY_EXPORT="/results/${result_file}" \
  "${k6_image}" run /scripts/main.js

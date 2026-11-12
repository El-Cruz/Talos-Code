#!/usr/bin/env bash
set -euo pipefail
set +x

# Run from the repository root in Bash / Git Bash. Never put secrets in arguments.
: "${VERCEL_SCOPE:?Set VERCEL_SCOPE to the verified team slug}"
expected_project="talos-code"
context=$(mktemp)
trap 'rm -f "$context"; unset dev_database_url prod_database_url' EXIT
vercel project inspect --non-interactive --json --scope "$VERCEL_SCOPE" > "$context"
node --input-type=module - "$context" "$expected_project" "$VERCEL_SCOPE" <<'JS'
import fs from 'node:fs';
const [file, project, scope] = process.argv.slice(2);
const current = JSON.parse(fs.readFileSync(file, 'utf8'));
if (current.name !== project || current.owner?.slug !== scope) {
  console.error('Project/team mismatch; no variables changed.'); process.exit(1);
}
JS

read -r -s -p "Development DATABASE_URL (also used by Preview): " dev_database_url
printf '\n'
read -r -s -p "Production DATABASE_URL: " prod_database_url
printf '\n'

# Ignore credentials and query options when detecting the same database endpoint.
printf '%s\n%s\n' "$dev_database_url" "$prod_database_url" | node --input-type=module -e '
import fs from "node:fs";
try {
  const values = fs.readFileSync(0,"utf8").trim().split("\n");
  if(values.length !== 2) throw new Error();
  const urls = values.map(value => new URL(value));
  if(urls.some(url => !url.hostname || !url.pathname || url.pathname === "/")) throw new Error();
  const endpoint = url => `${url.protocol}//${url.host}${url.pathname}`;
  if(endpoint(urls[0]) === endpoint(urls[1])) throw new Error();
} catch { console.error("Use two valid, distinct database endpoints. Nothing was written."); process.exit(1); }
'

# Development values are Config; Preview/Production credentials are Secrets.
printf '%s' "$dev_database_url" | vercel env add DATABASE_URL --environment development --yes --scope "$VERCEL_SCOPE"
printf '%s' "$dev_database_url" | vercel env add DATABASE_URL --environment preview --sensitive --yes --scope "$VERCEL_SCOPE"
printf '%s' "$prod_database_url" | vercel env add DATABASE_URL --environment production --sensitive --yes --scope "$VERCEL_SCOPE"
printf 'DATABASE_URL configured independently for development, preview and production.\n'

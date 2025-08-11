#!/usr/bin/env zsh

set -euo pipefail

PROJECT_NAME=${1:-oLegalChat}

if ! command -v vercel >/dev/null 2>&1; then
  echo "Installing Vercel CLI..."
  npm i -g vercel >/dev/null 2>&1 || { echo "Failed to install vercel CLI"; exit 1; }
fi

echo "Linking project to Vercel (project: $PROJECT_NAME)"
vercel link --yes --project "$PROJECT_NAME" --cwd "$(pwd)" >/dev/null

add_env() {
  local var_name=$1
  local value=$2
  local env=$3
  if [[ -z "$value" ]]; then
    echo "Skipping $var_name ($env): value is empty"
    return 0
  fi
  # Remove if exists, then add non-interactively
  vercel env rm "$var_name" "$env" --yes >/dev/null 2>&1 || true
  printf "%s" "$value" | vercel env add "$var_name" "$env" >/dev/null
  echo "Set $var_name for $env"
}

# Required/public
add_env NEXT_PUBLIC_SUPABASE_URL "${NEXT_PUBLIC_SUPABASE_URL-}" production
add_env NEXT_PUBLIC_SUPABASE_ANON_KEY "${NEXT_PUBLIC_SUPABASE_ANON_KEY-}" production

# Server-side
add_env SUPABASE_SERVICE_ROLE "${SUPABASE_SERVICE_ROLE-}" production
add_env CSRF_SECRET "${CSRF_SECRET-}" production

# Providers (set at least GOOGLE_GENERATIVE_AI_API_KEY)
add_env OPENAI_API_KEY "${OPENAI_API_KEY-}" production
add_env MISTRAL_API_KEY "${MISTRAL_API_KEY-}" production
add_env GOOGLE_GENERATIVE_AI_API_KEY "${GOOGLE_GENERATIVE_AI_API_KEY-}" production
add_env ANTHROPIC_API_KEY "${ANTHROPIC_API_KEY-}" production
add_env PERPLEXITY_API_KEY "${PERPLEXITY_API_KEY-}" production
add_env XAI_API_KEY "${XAI_API_KEY-}" production
add_env OPENROUTER_API_KEY "${OPENROUTER_API_KEY-}" production

# Optional
add_env OLLAMA_BASE_URL "${OLLAMA_BASE_URL-}" production
add_env NEXT_PUBLIC_VERCEL_URL "${NEXT_PUBLIC_VERCEL_URL-}" production

echo "Env configured. Triggering deploy..."
vercel --prod --yes --confirm --cwd "$(pwd)"

echo "Done."



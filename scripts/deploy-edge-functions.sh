#!/usr/bin/env bash
# Deploy all HandymanOS AI Supabase Edge Functions.
# Requires: Supabase CLI logged in (`supabase login`) and project linked (`supabase link`).
set -euo pipefail

FUNCTIONS=(
  openai-proxy
  create-checkout-session
  create-subscription-checkout
  stripe-webhook
  send-notification
  send-sms
)

echo "Deploying ${#FUNCTIONS[@]} Edge Functions..."

for fn in "${FUNCTIONS[@]}"; do
  echo "→ $fn"
  if [[ "$fn" == "stripe-webhook" ]]; then
    supabase functions deploy "$fn" --no-verify-jwt
  else
    supabase functions deploy "$fn"
  fi
done

echo ""
echo "Done. Set secrets in Supabase Dashboard → Edge Functions → Secrets:"
echo "  OPENAI_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY (optional)"
echo "Verify: npm run smoke:supabase"

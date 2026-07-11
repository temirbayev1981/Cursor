-- HandymanOS AI — minimal RPC patch when deploy smoke reports missing check_rate_limit
-- Run in Supabase SQL Editor, then re-run deploy workflow.

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  bucket_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_reset_at ON rate_limit_buckets (reset_at);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_limit INTEGER DEFAULT 30,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_count INTEGER;
  v_reset_at TIMESTAMPTZ;
BEGIN
  DELETE FROM rate_limit_buckets WHERE reset_at <= v_now;

  SELECT count, reset_at
  INTO v_count, v_reset_at
  FROM rate_limit_buckets
  WHERE bucket_key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO rate_limit_buckets (bucket_key, count, reset_at)
    VALUES (p_key, 1, v_now + make_interval(secs => p_window_seconds));
    RETURN jsonb_build_object('ok', true);
  END IF;

  IF v_count >= p_limit THEN
    RETURN jsonb_build_object(
      'ok', false,
      'retry_after', GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_reset_at - v_now)))::INTEGER)
    );
  END IF;

  UPDATE rate_limit_buckets
  SET count = v_count + 1
  WHERE bucket_key = p_key;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;

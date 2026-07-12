-- Close PostgREST access to rate_limit_buckets; only check_rate_limit (SECURITY DEFINER) may write.
ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;

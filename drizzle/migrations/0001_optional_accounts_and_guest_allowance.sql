CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 username text UNIQUE NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]{3,24}$')
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE FUNCTION public.create_star_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NEW.raw_user_meta_data ? 'username' THEN
  INSERT INTO public.profiles(id, username) VALUES (NEW.id, lower(trim(NEW.raw_user_meta_data->>'username')));
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.create_star_profile() FROM PUBLIC;
CREATE TRIGGER star_profile_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_star_profile();
CREATE FUNCTION public.star_username_available(candidate text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT candidate ~ '^[a-z0-9_]{3,24}$' AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate);
$$;
REVOKE ALL ON FUNCTION public.star_username_available(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.star_username_available(text) TO anon, authenticated;
CREATE FUNCTION public.star_login_email(candidate text) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT u.email FROM public.profiles p JOIN auth.users u ON u.id = p.id WHERE p.username = candidate LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.star_login_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.star_login_email(text) TO service_role;
CREATE TABLE public.guest_daily_usage (
 bucket text NOT NULL,
 usage_day date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
 requests integer NOT NULL DEFAULT 0,
 PRIMARY KEY(bucket, usage_day)
);
GRANT ALL ON public.guest_daily_usage TO service_role;
ALTER TABLE public.guest_daily_usage ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.claim_star_allowance(bucket_key text, daily_limit integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE used integer;
BEGIN
 IF daily_limit < 1 OR daily_limit > 1000 OR length(bucket_key) > 100 THEN RETURN false; END IF;
 INSERT INTO public.guest_daily_usage(bucket, usage_day, requests) VALUES (bucket_key, (now() AT TIME ZONE 'UTC')::date, 1)
 ON CONFLICT (bucket, usage_day) DO UPDATE SET requests = guest_daily_usage.requests + 1 WHERE guest_daily_usage.requests < daily_limit
 RETURNING requests INTO used;
 RETURN used IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_star_allowance(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_star_allowance(text, integer) TO service_role;
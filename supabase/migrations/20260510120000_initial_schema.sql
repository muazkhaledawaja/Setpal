


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."accept_client_invite"("invite_token" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_invite public.client_invites%rowtype;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select * into v_invite
  from public.client_invites
  where token = invite_token
    and status = 'pending'
    and expires_at > now()
  for update;

  if not found then
    raise exception 'invalid or expired invite token';
  end if;

  update public.client_invites
    set status = 'accepted', accepted_at = now()
    where id = v_invite.id;

  insert into public.clients (id, coach_id, status, start_date)
  values (v_uid, v_invite.coach_id, 'active', current_date)
  on conflict (id) do update
    set coach_id = excluded.coach_id, status = 'active';
end;
$$;


ALTER FUNCTION "public"."accept_client_invite"("invite_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_users"() RETURNS TABLE("id" "uuid", "full_name" "text", "email" "text", "role" "text", "status" "text", "locale" "text", "created_at" timestamp with time zone, "last_sign_in" timestamp with time zone, "client_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return query
    select p.id, p.full_name, u.email::text, p.role, p.status, p.locale, p.created_at, u.last_sign_in_at,
      (select count(*) from public.clients c where c.coach_id = p.id) as client_count
    from public.profiles p
    join auth.users u on u.id = p.id
    order by case when p.status = 'pending' then 0 else 1 end, p.created_at desc;
end;
$$;


ALTER FUNCTION "public"."admin_list_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_user"("target" "uuid", "new_role" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if new_role not in ('admin', 'coach', 'client') then raise exception 'invalid role: %', new_role; end if;
  update public.profiles set role = new_role, status = 'active', updated_at = now() where id = target;
  if new_role = 'coach' then
    insert into public.coaches (id, trial_ends_at) values (target, now() + interval '14 days') on conflict (id) do nothing;
  end if;
end;
$$;


ALTER FUNCTION "public"."approve_user"("target" "uuid", "new_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ select role from public.profiles where id = auth.uid(); $$;


ALTER FUNCTION "public"."current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  meta_role   text := coalesce(new.raw_user_meta_data->>'role', 'coach');
  meta_name   text := coalesce(new.raw_user_meta_data->>'full_name', new.email);
  meta_locale text := coalesce(new.raw_user_meta_data->>'locale', 'ar');
begin
  if meta_role not in ('admin', 'coach', 'client') then
    meta_role := 'coach';
  end if;
  if meta_locale not in ('ar', 'en') then
    meta_locale := 'ar';
  end if;

  insert into public.profiles (id, role, full_name, locale, status)
  values (new.id, meta_role, meta_name, meta_locale, 'pending')
  on conflict (id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false); $$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_coach"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ select coalesce((select role = 'coach' from public.profiles where id = auth.uid()), false); $$;


ALTER FUNCTION "public"."is_coach"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin new.updated_at = now(); return new; end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_user_status"("target" "uuid", "new_status" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if new_status not in ('pending', 'active', 'suspended') then raise exception 'invalid status: %', new_status; end if;
  update public.profiles set status = new_status, updated_at = now() where id = target;
end;
$$;


ALTER FUNCTION "public"."set_user_status"("target" "uuid", "new_status" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."client_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "token" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(32), 'hex'::"text") NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "accepted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "client_invites_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."client_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_packages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "name_ar" "text",
    "name_en" "text",
    "tier" "text" NOT NULL,
    "price_egp" numeric(10,2),
    "duration_weeks" integer,
    "features" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "client_packages_tier_check" CHECK (("tier" = ANY (ARRAY['basic'::"text", 'premium'::"text", 'elite'::"text"])))
);


ALTER TABLE "public"."client_packages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "package_id" "uuid",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "start_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "end_date" "date",
    "goal_ar" "text",
    "goal_en" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "clients_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'ended'::"text"])))
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coach_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "provider" "text" DEFAULT 'paddle'::"text" NOT NULL,
    "provider_subscription_id" "text",
    "tier" "text" NOT NULL,
    "status" "text" NOT NULL,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "amount_egp" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "coach_subscriptions_status_check" CHECK (("status" = ANY (ARRAY['trialing'::"text", 'active'::"text", 'past_due'::"text", 'canceled'::"text", 'expired'::"text"]))),
    CONSTRAINT "coach_subscriptions_tier_check" CHECK (("tier" = ANY (ARRAY['starter'::"text", 'pro'::"text", 'elite'::"text"])))
);


ALTER TABLE "public"."coach_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coaches" (
    "id" "uuid" NOT NULL,
    "bio_ar" "text",
    "bio_en" "text",
    "specializations" "text"[] DEFAULT '{}'::"text"[],
    "subscription_tier" "text" DEFAULT 'trial'::"text" NOT NULL,
    "subscription_status" "text" DEFAULT 'active'::"text" NOT NULL,
    "trial_ends_at" timestamp with time zone DEFAULT ("now"() + '14 days'::interval),
    "current_period_end" timestamp with time zone,
    "client_limit" integer DEFAULT 10 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "coaches_subscription_status_check" CHECK (("subscription_status" = ANY (ARRAY['active'::"text", 'past_due'::"text", 'canceled'::"text", 'expired'::"text"]))),
    CONSTRAINT "coaches_subscription_tier_check" CHECK (("subscription_tier" = ANY (ARRAY['trial'::"text", 'starter'::"text", 'pro'::"text", 'elite'::"text"])))
);


ALTER TABLE "public"."coaches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exercises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid",
    "name_ar" "text" NOT NULL,
    "name_en" "text" NOT NULL,
    "muscle_group" "text" NOT NULL,
    "equipment" "text",
    "video_url" "text",
    "thumbnail_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "exercises_muscle_group_check" CHECK (("muscle_group" = ANY (ARRAY['chest'::"text", 'back'::"text", 'shoulders'::"text", 'legs'::"text", 'arms'::"text", 'core'::"text", 'full_body'::"text", 'cardio'::"text"])))
);


ALTER TABLE "public"."exercises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_id" "uuid" NOT NULL,
    "template_version" integer NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "responses" "jsonb" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."form_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title_ar" "text",
    "title_en" "text",
    "description_ar" "text",
    "description_en" "text",
    "schema" "jsonb" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "form_templates_type_check" CHECK (("type" = ANY (ARRAY['intake'::"text", 'workout'::"text", 'diet'::"text", 'checkin'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."form_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."measurements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "measured_at" "date" DEFAULT CURRENT_DATE NOT NULL,
    "weight_kg" numeric(5,2),
    "body_fat_pct" numeric(4,2),
    "chest_cm" numeric(5,2),
    "waist_cm" numeric(5,2),
    "hips_cm" numeric(5,2),
    "thigh_cm" numeric(5,2),
    "arm_cm" numeric(5,2),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."measurements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "full_name" "text",
    "locale" "text" DEFAULT 'ar'::"text" NOT NULL,
    "avatar_url" "text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    CONSTRAINT "profiles_locale_check" CHECK (("locale" = ANY (ARRAY['ar'::"text", 'en'::"text"]))),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'coach'::"text", 'client'::"text"]))),
    CONSTRAINT "profiles_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'suspended'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."progress_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "log_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "weight_kg" numeric(5,2),
    "water_ml" integer,
    "mood" integer,
    "energy" integer,
    "sleep_hours" numeric(3,1),
    "notes" "text",
    "completed_workout" "jsonb",
    "photos" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "progress_logs_energy_check" CHECK ((("energy" >= 1) AND ("energy" <= 5))),
    CONSTRAINT "progress_logs_mood_check" CHECK ((("mood" >= 1) AND ("mood" <= 5)))
);


ALTER TABLE "public"."progress_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_day_exercises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "day_id" "uuid" NOT NULL,
    "exercise_id" "uuid" NOT NULL,
    "order_index" integer NOT NULL,
    "sets" integer DEFAULT 3 NOT NULL,
    "rep_range" "text" DEFAULT '8-12'::"text" NOT NULL,
    "rest_seconds" integer,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workout_day_exercises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_days" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "order_index" integer NOT NULL,
    "is_rest" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workout_days" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_log_sets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "log_id" "uuid" NOT NULL,
    "exercise_id" "uuid",
    "exercise_name_snapshot" "text" NOT NULL,
    "set_number" integer NOT NULL,
    "reps" integer,
    "weight" numeric,
    "completed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workout_log_sets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "plan_id" "uuid",
    "day_id" "uuid",
    "day_name_snapshot" "text" NOT NULL,
    "status" "text" DEFAULT 'in_progress'::"text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "workout_logs_status_check" CHECK (("status" = ANY (ARRAY['in_progress'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."workout_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "name" "text" NOT NULL,
    "description_ar" "text",
    "description_en" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "workout_plans_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'archived'::"text", 'draft'::"text"])))
);


ALTER TABLE "public"."workout_plans" OWNER TO "postgres";


ALTER TABLE ONLY "public"."client_invites"
    ADD CONSTRAINT "client_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_invites"
    ADD CONSTRAINT "client_invites_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."client_packages"
    ADD CONSTRAINT "client_packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_subscriptions"
    ADD CONSTRAINT "coach_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_subscriptions"
    ADD CONSTRAINT "coach_subscriptions_provider_subscription_id_key" UNIQUE ("provider_subscription_id");



ALTER TABLE ONLY "public"."coaches"
    ADD CONSTRAINT "coaches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_templates"
    ADD CONSTRAINT "form_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."measurements"
    ADD CONSTRAINT "measurements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."progress_logs"
    ADD CONSTRAINT "progress_logs_client_id_log_date_key" UNIQUE ("client_id", "log_date");



ALTER TABLE ONLY "public"."progress_logs"
    ADD CONSTRAINT "progress_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_day_exercises"
    ADD CONSTRAINT "workout_day_exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_days"
    ADD CONSTRAINT "workout_days_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_log_sets"
    ADD CONSTRAINT "workout_log_sets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_logs"
    ADD CONSTRAINT "workout_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_plans"
    ADD CONSTRAINT "workout_plans_pkey" PRIMARY KEY ("id");



CREATE INDEX "client_invites_coach_id_idx" ON "public"."client_invites" USING "btree" ("coach_id");



CREATE INDEX "client_invites_token_idx" ON "public"."client_invites" USING "btree" ("token");



CREATE INDEX "exercises_coach_id_idx" ON "public"."exercises" USING "btree" ("coach_id");



CREATE INDEX "exercises_muscle_group_idx" ON "public"."exercises" USING "btree" ("muscle_group");



CREATE INDEX "idx_client_packages_coach" ON "public"."client_packages" USING "btree" ("coach_id");



CREATE INDEX "idx_clients_coach" ON "public"."clients" USING "btree" ("coach_id");



CREATE INDEX "idx_clients_status" ON "public"."clients" USING "btree" ("coach_id", "status");



CREATE INDEX "idx_coach_subscriptions_coach" ON "public"."coach_subscriptions" USING "btree" ("coach_id");



CREATE INDEX "idx_coaches_subscription" ON "public"."coaches" USING "btree" ("subscription_status", "subscription_tier");



CREATE INDEX "idx_form_submissions_client" ON "public"."form_submissions" USING "btree" ("client_id", "submitted_at" DESC);



CREATE INDEX "idx_form_submissions_coach" ON "public"."form_submissions" USING "btree" ("coach_id", "submitted_at" DESC);



CREATE INDEX "idx_form_templates_coach" ON "public"."form_templates" USING "btree" ("coach_id", "is_active");



CREATE INDEX "idx_measurements_client" ON "public"."measurements" USING "btree" ("client_id", "measured_at" DESC);



CREATE INDEX "idx_progress_logs_client" ON "public"."progress_logs" USING "btree" ("client_id", "log_date" DESC);



CREATE INDEX "profiles_status_idx" ON "public"."profiles" USING "btree" ("status");



CREATE INDEX "workout_day_exercises_day_id_idx" ON "public"."workout_day_exercises" USING "btree" ("day_id");



CREATE INDEX "workout_days_plan_id_idx" ON "public"."workout_days" USING "btree" ("plan_id");



CREATE INDEX "workout_log_sets_log_id_idx" ON "public"."workout_log_sets" USING "btree" ("log_id");



CREATE INDEX "workout_logs_client_id_idx" ON "public"."workout_logs" USING "btree" ("client_id");



CREATE INDEX "workout_plans_client_id_idx" ON "public"."workout_plans" USING "btree" ("client_id");



CREATE INDEX "workout_plans_coach_id_idx" ON "public"."workout_plans" USING "btree" ("coach_id");



CREATE OR REPLACE TRIGGER "client_packages_updated_at" BEFORE UPDATE ON "public"."client_packages" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "clients_updated_at" BEFORE UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "coach_subscriptions_updated_at" BEFORE UPDATE ON "public"."coach_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "coaches_updated_at" BEFORE UPDATE ON "public"."coaches" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "form_templates_updated_at" BEFORE UPDATE ON "public"."form_templates" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "progress_logs_updated_at" BEFORE UPDATE ON "public"."progress_logs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."client_invites"
    ADD CONSTRAINT "client_invites_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_packages"
    ADD CONSTRAINT "client_packages_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."client_packages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."coach_subscriptions"
    ADD CONSTRAINT "coach_subscriptions_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coaches"
    ADD CONSTRAINT "coaches_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "exercises_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."form_templates"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."form_templates"
    ADD CONSTRAINT "form_templates_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."measurements"
    ADD CONSTRAINT "measurements_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."progress_logs"
    ADD CONSTRAINT "progress_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_day_exercises"
    ADD CONSTRAINT "workout_day_exercises_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "public"."workout_days"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_day_exercises"
    ADD CONSTRAINT "workout_day_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."workout_days"
    ADD CONSTRAINT "workout_days_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."workout_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_log_sets"
    ADD CONSTRAINT "workout_log_sets_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workout_log_sets"
    ADD CONSTRAINT "workout_log_sets_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "public"."workout_logs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_logs"
    ADD CONSTRAINT "workout_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_logs"
    ADD CONSTRAINT "workout_logs_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "public"."workout_days"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workout_logs"
    ADD CONSTRAINT "workout_logs_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."workout_plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workout_plans"
    ADD CONSTRAINT "workout_plans_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workout_plans"
    ADD CONSTRAINT "workout_plans_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "admins_select_all_profiles" ON "public"."profiles" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "admins_update_all_profiles" ON "public"."profiles" FOR UPDATE USING ("public"."is_admin"());



ALTER TABLE "public"."client_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_packages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_packages_admin_all" ON "public"."client_packages" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "client_packages_clients_see_own_coach" ON "public"."client_packages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."id" = "auth"."uid"()) AND ("c"."coach_id" = "client_packages"."coach_id")))));



CREATE POLICY "client_packages_coach_manages_own" ON "public"."client_packages" USING (("coach_id" = "auth"."uid"())) WITH CHECK (("coach_id" = "auth"."uid"()));



ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clients_admin_all" ON "public"."clients" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "clients_coach_manages" ON "public"."clients" USING (("coach_id" = "auth"."uid"())) WITH CHECK (("coach_id" = "auth"."uid"()));



CREATE POLICY "clients_select_self" ON "public"."clients" FOR SELECT USING (("id" = "auth"."uid"()));



ALTER TABLE "public"."coach_subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "coach_subscriptions_admin_all" ON "public"."coach_subscriptions" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "coach_subscriptions_select_own" ON "public"."coach_subscriptions" FOR SELECT USING (("coach_id" = "auth"."uid"()));



ALTER TABLE "public"."coaches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "coaches_admin_all" ON "public"."coaches" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "coaches_insert_own_invites" ON "public"."client_invites" FOR INSERT WITH CHECK (("coach_id" = "auth"."uid"()));



CREATE POLICY "coaches_select_by_own_clients" ON "public"."coaches" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."id" = "auth"."uid"()) AND ("c"."coach_id" = "coaches"."id")))));



CREATE POLICY "coaches_select_own_invites" ON "public"."client_invites" FOR SELECT USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "coaches_select_own_or_admin" ON "public"."coaches" FOR SELECT USING ((("id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "coaches_update_own" ON "public"."coaches" FOR UPDATE USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "coaches_update_own_invites" ON "public"."client_invites" FOR UPDATE USING (("coach_id" = "auth"."uid"()));



ALTER TABLE "public"."exercises" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "exercises_delete_own" ON "public"."exercises" FOR DELETE TO "authenticated" USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "exercises_insert_own" ON "public"."exercises" FOR INSERT TO "authenticated" WITH CHECK (("coach_id" = "auth"."uid"()));



CREATE POLICY "exercises_select_authenticated" ON "public"."exercises" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "exercises_update_own" ON "public"."exercises" FOR UPDATE TO "authenticated" USING (("coach_id" = "auth"."uid"()));



ALTER TABLE "public"."form_submissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "form_submissions_admin_all" ON "public"."form_submissions" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "form_submissions_client_owns" ON "public"."form_submissions" USING (("client_id" = "auth"."uid"())) WITH CHECK (("client_id" = "auth"."uid"()));



CREATE POLICY "form_submissions_coach_reads" ON "public"."form_submissions" FOR SELECT USING (("coach_id" = "auth"."uid"()));



ALTER TABLE "public"."form_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "form_templates_admin_all" ON "public"."form_templates" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "form_templates_clients_see_their_coach" ON "public"."form_templates" FOR SELECT USING ((("is_active" = true) AND (EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."id" = "auth"."uid"()) AND ("c"."coach_id" = "form_templates"."coach_id"))))));



CREATE POLICY "form_templates_coach_manages_own" ON "public"."form_templates" USING (("coach_id" = "auth"."uid"())) WITH CHECK (("coach_id" = "auth"."uid"()));



ALTER TABLE "public"."measurements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "measurements_admin_all" ON "public"."measurements" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "measurements_client_owns" ON "public"."measurements" USING (("client_id" = "auth"."uid"())) WITH CHECK (("client_id" = "auth"."uid"()));



CREATE POLICY "measurements_coach_reads" ON "public"."measurements" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."id" = "measurements"."client_id") AND ("c"."coach_id" = "auth"."uid"())))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_admin_all" ON "public"."profiles" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "profiles_select_client_sees_own_coach" ON "public"."profiles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."id" = "auth"."uid"()) AND ("c"."coach_id" = "profiles"."id")))));



CREATE POLICY "profiles_select_coach_sees_own_clients" ON "public"."profiles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."id" = "profiles"."id") AND ("c"."coach_id" = "auth"."uid"())))));



CREATE POLICY "profiles_select_own_or_admin" ON "public"."profiles" FOR SELECT USING ((("id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



ALTER TABLE "public"."progress_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "progress_logs_admin_all" ON "public"."progress_logs" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "progress_logs_client_owns" ON "public"."progress_logs" USING (("client_id" = "auth"."uid"())) WITH CHECK (("client_id" = "auth"."uid"()));



CREATE POLICY "progress_logs_coach_reads" ON "public"."progress_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."clients" "c"
  WHERE (("c"."id" = "progress_logs"."client_id") AND ("c"."coach_id" = "auth"."uid"())))));



CREATE POLICY "public_read_invite_by_token" ON "public"."client_invites" FOR SELECT USING ((("status" = 'pending'::"text") AND ("expires_at" > "now"())));



ALTER TABLE "public"."workout_day_exercises" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workout_day_exercises_client_select" ON "public"."workout_day_exercises" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."workout_days" "d"
     JOIN "public"."workout_plans" "p" ON (("p"."id" = "d"."plan_id")))
  WHERE (("d"."id" = "workout_day_exercises"."day_id") AND ("p"."client_id" = "auth"."uid"())))));



CREATE POLICY "workout_day_exercises_coach_all" ON "public"."workout_day_exercises" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."workout_days" "d"
     JOIN "public"."workout_plans" "p" ON (("p"."id" = "d"."plan_id")))
  WHERE (("d"."id" = "workout_day_exercises"."day_id") AND ("p"."coach_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."workout_days" "d"
     JOIN "public"."workout_plans" "p" ON (("p"."id" = "d"."plan_id")))
  WHERE (("d"."id" = "workout_day_exercises"."day_id") AND ("p"."coach_id" = "auth"."uid"())))));



ALTER TABLE "public"."workout_days" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workout_days_client_select" ON "public"."workout_days" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workout_plans" "p"
  WHERE (("p"."id" = "workout_days"."plan_id") AND ("p"."client_id" = "auth"."uid"())))));



CREATE POLICY "workout_days_coach_all" ON "public"."workout_days" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workout_plans" "p"
  WHERE (("p"."id" = "workout_days"."plan_id") AND ("p"."coach_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workout_plans" "p"
  WHERE (("p"."id" = "workout_days"."plan_id") AND ("p"."coach_id" = "auth"."uid"())))));



ALTER TABLE "public"."workout_log_sets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workout_log_sets_client_all" ON "public"."workout_log_sets" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workout_logs" "l"
  WHERE (("l"."id" = "workout_log_sets"."log_id") AND ("l"."client_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workout_logs" "l"
  WHERE (("l"."id" = "workout_log_sets"."log_id") AND ("l"."client_id" = "auth"."uid"())))));



ALTER TABLE "public"."workout_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workout_logs_client_all" ON "public"."workout_logs" TO "authenticated" USING (("client_id" = "auth"."uid"())) WITH CHECK (("client_id" = "auth"."uid"()));



CREATE POLICY "workout_logs_coach_select" ON "public"."workout_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workout_plans" "p"
  WHERE (("p"."id" = "workout_logs"."plan_id") AND ("p"."coach_id" = "auth"."uid"())))));



ALTER TABLE "public"."workout_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workout_plans_client_select" ON "public"."workout_plans" FOR SELECT TO "authenticated" USING (("client_id" = "auth"."uid"()));



CREATE POLICY "workout_plans_coach_all" ON "public"."workout_plans" TO "authenticated" USING (("coach_id" = "auth"."uid"())) WITH CHECK (("coach_id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"(character) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "anon";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"("inet") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "anon";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."accept_client_invite"("invite_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_client_invite"("invite_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_client_invite"("invite_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_list_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."admin_list_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_list_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_user"("target" "uuid", "new_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_user"("target" "uuid", "new_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_user"("target" "uuid", "new_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_coach"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_coach"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_coach"() TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_user_status"("target" "uuid", "new_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_user_status"("target" "uuid", "new_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_user_status"("target" "uuid", "new_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "service_role";












GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "service_role";









GRANT ALL ON TABLE "public"."client_invites" TO "anon";
GRANT ALL ON TABLE "public"."client_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."client_invites" TO "service_role";



GRANT ALL ON TABLE "public"."client_packages" TO "anon";
GRANT ALL ON TABLE "public"."client_packages" TO "authenticated";
GRANT ALL ON TABLE "public"."client_packages" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."coach_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."coach_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."coaches" TO "anon";
GRANT ALL ON TABLE "public"."coaches" TO "authenticated";
GRANT ALL ON TABLE "public"."coaches" TO "service_role";



GRANT ALL ON TABLE "public"."exercises" TO "anon";
GRANT ALL ON TABLE "public"."exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."exercises" TO "service_role";



GRANT ALL ON TABLE "public"."form_submissions" TO "anon";
GRANT ALL ON TABLE "public"."form_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."form_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."form_templates" TO "anon";
GRANT ALL ON TABLE "public"."form_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."form_templates" TO "service_role";



GRANT ALL ON TABLE "public"."measurements" TO "anon";
GRANT ALL ON TABLE "public"."measurements" TO "authenticated";
GRANT ALL ON TABLE "public"."measurements" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."progress_logs" TO "anon";
GRANT ALL ON TABLE "public"."progress_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."progress_logs" TO "service_role";



GRANT ALL ON TABLE "public"."workout_day_exercises" TO "anon";
GRANT ALL ON TABLE "public"."workout_day_exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_day_exercises" TO "service_role";



GRANT ALL ON TABLE "public"."workout_days" TO "anon";
GRANT ALL ON TABLE "public"."workout_days" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_days" TO "service_role";



GRANT ALL ON TABLE "public"."workout_log_sets" TO "anon";
GRANT ALL ON TABLE "public"."workout_log_sets" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_log_sets" TO "service_role";



GRANT ALL ON TABLE "public"."workout_logs" TO "anon";
GRANT ALL ON TABLE "public"."workout_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_logs" TO "service_role";



GRANT ALL ON TABLE "public"."workout_plans" TO "anon";
GRANT ALL ON TABLE "public"."workout_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_plans" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";




































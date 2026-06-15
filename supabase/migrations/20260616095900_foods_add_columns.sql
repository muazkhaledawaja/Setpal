-- foods table existed from initial schema with different column names.
-- Rename/add/drop to match the new schema used by the seed and app.
ALTER TABLE public.foods
  ADD COLUMN IF NOT EXISTS serving_label_ar text,
  ADD COLUMN IF NOT EXISTS serving_label_en text,
  ADD COLUMN IF NOT EXISTS serving_grams numeric not null default 100,
  ADD COLUMN IF NOT EXISTS calories numeric not null default 0,
  ADD COLUMN IF NOT EXISTS protein_g numeric not null default 0,
  ADD COLUMN IF NOT EXISTS carbs_g numeric not null default 0,
  ADD COLUMN IF NOT EXISTS fat_g numeric not null default 0;

ALTER TABLE public.foods
  DROP COLUMN IF EXISTS calories_per_100g,
  DROP COLUMN IF EXISTS fiber_g,
  DROP COLUMN IF EXISTS serving_size_g;

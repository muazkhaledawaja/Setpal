-- Form Templates and Questions
-- Migration: 20260612_01_form_templates.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Reconcile with the squashed baseline (20260510120000_initial_schema.sql), which
-- contains a STALE earlier form_templates (title_ar/title_en/schema, type enum
-- intake/workout/diet/checkin/custom) plus the legacy form_submissions table that
-- the new forms system replaces (form_assignments/form_responses). When this
-- migration replays AFTER the baseline, the old shape is incompatible with the new
-- columns this file + migration 03's views require (name, settings, parent_template_id).
-- Drop the legacy forms objects so this migration can create the correct shape.
-- This is safe in a fresh CI/local replay (no data); production drift is handled
-- separately and is out of scope here.
DROP TABLE IF EXISTS public.form_submissions CASCADE;
DROP TABLE IF EXISTS public.form_templates CASCADE;

-- Form Templates table
CREATE TABLE IF NOT EXISTS public.form_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('onboarding', 'check_in', 'custom')),
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    version INTEGER DEFAULT 1,
    parent_template_id UUID REFERENCES public.form_templates(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Form Questions table
CREATE TABLE IF NOT EXISTS public.form_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.form_templates(id) ON DELETE CASCADE,
    label_ar VARCHAR(500) NOT NULL,
    label_en VARCHAR(500) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'text', 'textarea', 'number', 'select', 'multiselect', 
        'radio', 'checkbox', 'date', 'file', 'scale', 'yes_no'
    )),
    options JSONB, -- [{"value": "...", "label_ar": "...", "label_en": "..."}]
    validation JSONB DEFAULT '{}', -- {required, min, max, min_length, max_length, pattern, accept, max_size_mb}
    placeholder_ar VARCHAR(255),
    placeholder_en VARCHAR(255),
    help_text_ar TEXT,
    help_text_en TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    conditional_logic JSONB, -- {show_if: {question_id, operator, value}}
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_form_templates_coach ON public.form_templates(coach_id);
CREATE INDEX IF NOT EXISTS idx_form_templates_type ON public.form_templates(type);
CREATE INDEX IF NOT EXISTS idx_form_templates_active ON public.form_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_form_questions_template ON public.form_questions(template_id, order_index);

-- RLS Policies
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_questions ENABLE ROW LEVEL SECURITY;

-- Coach can CRUD own templates
DROP POLICY IF EXISTS "Coach manage own templates" ON public.form_templates;
CREATE POLICY "Coach manage own templates" ON public.form_templates
    FOR ALL USING (coach_id = auth.uid());

-- Coach can CRUD questions for own templates
DROP POLICY IF EXISTS "Coach manage own template questions" ON public.form_questions;
CREATE POLICY "Coach manage own template questions" ON public.form_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.form_templates ft
            WHERE ft.id = form_questions.template_id
            AND ft.coach_id = auth.uid()
        )
    );

-- NOTE: "Client read assigned template questions" policy lives in migration 02
-- (20260612_02_form_assignments.sql) because it references public.form_assignments,
-- which does not exist yet at this point in the migration order.

-- Admin full access
DROP POLICY IF EXISTS "Admin full access templates" ON public.form_templates;
CREATE POLICY "Admin full access templates" ON public.form_templates FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "Admin full access questions" ON public.form_questions;
CREATE POLICY "Admin full access questions" ON public.form_questions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_form_templates_updated_at ON public.form_templates;
CREATE TRIGGER update_form_templates_updated_at
    BEFORE UPDATE ON public.form_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_form_questions_updated_at ON public.form_questions;
CREATE TRIGGER update_form_questions_updated_at
    BEFORE UPDATE ON public.form_questions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
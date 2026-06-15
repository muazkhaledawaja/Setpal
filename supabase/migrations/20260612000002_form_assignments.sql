-- Form Assignments, Responses, and Files
-- Migration: 20260612_02_form_assignments.sql

-- Form Assignments table
CREATE TABLE IF NOT EXISTS public.form_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.form_templates(id) ON DELETE CASCADE,
    template_version INTEGER NOT NULL DEFAULT 1,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'skipped')),
    due_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(template_id, client_id, template_version)
);

-- Form Responses table
CREATE TABLE IF NOT EXISTS public.form_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.form_assignments(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.form_questions(id) ON DELETE CASCADE,
    value JSONB NOT NULL,
    is_draft BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(assignment_id, question_id)
);

-- Form Files table (references Supabase Storage)
CREATE TABLE IF NOT EXISTS public.form_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES public.form_responses(id) ON DELETE CASCADE,
    storage_path VARCHAR(500) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_form_assignments_client ON public.form_assignments(client_id, status);
CREATE INDEX IF NOT EXISTS idx_form_assignments_template ON public.form_assignments(template_id);
CREATE INDEX IF NOT EXISTS idx_form_assignments_due ON public.form_assignments(due_at) WHERE status IN ('pending', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_form_responses_assignment ON public.form_responses(assignment_id);
CREATE INDEX IF NOT EXISTS idx_form_files_response ON public.form_files(response_id);

-- RLS Policies
ALTER TABLE public.form_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_files ENABLE ROW LEVEL SECURITY;

-- Coach can read all assignments for own clients
DROP POLICY IF EXISTS "Coach read own clients assignments" ON public.form_assignments;
CREATE POLICY "Coach read own clients assignments" ON public.form_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = form_assignments.client_id
            AND c.coach_id = auth.uid()
        )
    );

-- Coach can create assignments for own clients
DROP POLICY IF EXISTS "Coach create assignments for own clients" ON public.form_assignments;
CREATE POLICY "Coach create assignments for own clients" ON public.form_assignments
    FOR INSERT WITH CHECK (
        assigned_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = form_assignments.client_id
            AND c.coach_id = auth.uid()
        )
    );

-- Coach can update assignments (e.g., mark skipped)
DROP POLICY IF EXISTS "Coach update own clients assignments" ON public.form_assignments;
CREATE POLICY "Coach update own clients assignments" ON public.form_assignments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = form_assignments.client_id
            AND c.coach_id = auth.uid()
        )
    );

-- Client can read own assignments
DROP POLICY IF EXISTS "Client read own assignments" ON public.form_assignments;
CREATE POLICY "Client read own assignments" ON public.form_assignments
    FOR SELECT USING (client_id = auth.uid());

-- Client can update own assignment status (start, complete)
DROP POLICY IF EXISTS "Client update own assignment status" ON public.form_assignments;
CREATE POLICY "Client update own assignment status" ON public.form_assignments
    FOR UPDATE USING (client_id = auth.uid())
    WITH CHECK (client_id = auth.uid());

-- Responses: Coach can read responses for own clients' assignments
DROP POLICY IF EXISTS "Coach read own clients responses" ON public.form_responses;
CREATE POLICY "Coach read own clients responses" ON public.form_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.form_assignments fa
            JOIN public.clients c ON c.id = fa.client_id
            WHERE fa.id = form_responses.assignment_id
            AND c.coach_id = auth.uid()
        )
    );

-- Client can CRUD own responses
DROP POLICY IF EXISTS "Client manage own responses" ON public.form_responses;
CREATE POLICY "Client manage own responses" ON public.form_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.form_assignments fa
            WHERE fa.id = form_responses.assignment_id
            AND fa.client_id = auth.uid()
        )
    );

-- Files: Coach can read files for own clients' responses
DROP POLICY IF EXISTS "Coach read own clients form files" ON public.form_files;
CREATE POLICY "Coach read own clients form files" ON public.form_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.form_responses fr
            JOIN public.form_assignments fa ON fa.id = fr.assignment_id
            JOIN public.clients c ON c.id = fa.client_id
            WHERE fr.id = form_files.response_id
            AND c.coach_id = auth.uid()
        )
    );

-- Client can CRUD own files
DROP POLICY IF EXISTS "Client manage own form files" ON public.form_files;
CREATE POLICY "Client manage own form files" ON public.form_files
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.form_responses fr
            JOIN public.form_assignments fa ON fa.id = fr.assignment_id
            WHERE fr.id = form_files.response_id
            AND fa.client_id = auth.uid()
        )
    );

-- Client can read assigned template questions (via assignments join)
-- Defined here (not in migration 01) because it references public.form_assignments.
DROP POLICY IF EXISTS "Client read assigned template questions" ON public.form_questions;
CREATE POLICY "Client read assigned template questions" ON public.form_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.form_assignments fa
            WHERE fa.client_id = auth.uid()
            AND fa.template_id = form_questions.template_id
            AND fa.status IN ('pending', 'in_progress', 'completed')
        )
    );

-- Admin full access
DROP POLICY IF EXISTS "Admin full access assignments" ON public.form_assignments;
CREATE POLICY "Admin full access assignments" ON public.form_assignments FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "Admin full access responses" ON public.form_responses;
CREATE POLICY "Admin full access responses" ON public.form_responses FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "Admin full access files" ON public.form_files;
CREATE POLICY "Admin full access files" ON public.form_files FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Updated at triggers
DROP TRIGGER IF EXISTS update_form_assignments_updated_at ON public.form_assignments;
CREATE TRIGGER update_form_assignments_updated_at
    BEFORE UPDATE ON public.form_assignments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_form_responses_updated_at ON public.form_responses;
CREATE TRIGGER update_form_responses_updated_at
    BEFORE UPDATE ON public.form_responses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
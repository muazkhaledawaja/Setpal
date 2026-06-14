-- Additional Indexes, Helper Functions, and Views
-- Migration: 20260612_03_indexes_functions.sql

-- Additional composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_form_assignments_coach_status ON public.form_assignments(template_id, status) 
    WHERE status IN ('pending', 'in_progress', 'completed');

CREATE INDEX IF NOT EXISTS idx_form_responses_question ON public.form_responses(question_id);

-- View: Template with question count and assignment stats
CREATE OR REPLACE VIEW public.v_form_templates_summary
WITH (security_invoker = true) AS
SELECT 
    ft.id,
    ft.coach_id,
    ft.name,
    ft.description_ar,
    ft.description_en,
    ft.type,
    ft.is_active,
    ft.version,
    ft.parent_template_id,
    ft.created_at,
    ft.updated_at,
    COUNT(DISTINCT fq.id) AS question_count,
    COUNT(DISTINCT fa.id) AS total_assignments,
    COUNT(DISTINCT fa.id) FILTER (WHERE fa.status = 'completed') AS completed_assignments,
    COUNT(DISTINCT fa.id) FILTER (WHERE fa.status IN ('pending', 'in_progress')) AS active_assignments,
    COUNT(DISTINCT fa.id) FILTER (WHERE fa.status = 'overdue') AS overdue_assignments
FROM public.form_templates ft
LEFT JOIN public.form_questions fq ON fq.template_id = ft.id
LEFT JOIN public.form_assignments fa ON fa.template_id = ft.id AND fa.template_version = ft.version
GROUP BY ft.id;

-- View: Client assignment dashboard
CREATE OR REPLACE VIEW public.v_client_assignments
WITH (security_invoker = true) AS
SELECT 
    fa.id AS assignment_id,
    fa.client_id,
    fa.template_id,
    fa.template_version,
    fa.status,
    fa.due_at,
    fa.started_at,
    fa.completed_at,
    fa.created_at AS assigned_at,
    ft.name AS template_name,
    ft.description_ar AS template_description_ar,
    ft.description_en AS template_description_en,
    ft.type AS template_type,
    ft.settings AS template_settings,
    COUNT(fr.id) AS responses_count,
    COUNT(fq.id) AS total_questions
FROM public.form_assignments fa
JOIN public.form_templates ft ON ft.id = fa.template_id AND ft.version = fa.template_version
LEFT JOIN public.form_responses fr ON fr.assignment_id = fa.id AND fr.is_draft = false
LEFT JOIN public.form_questions fq ON fq.template_id = ft.id
GROUP BY fa.id, ft.id;

-- Function: Get next recurring due date
CREATE OR REPLACE FUNCTION public.get_next_recurring_due_date(
    p_template_id UUID,
    p_frequency_days INTEGER
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    v_last_due TIMESTAMPTZ;
BEGIN
    SELECT MAX(due_at) INTO v_last_due
    FROM public.form_assignments
    WHERE template_id = p_template_id
    AND status IN ('completed', 'overdue');
    
    IF v_last_due IS NULL THEN
        RETURN now() + (p_frequency_days || ' days')::INTERVAL;
    END IF;
    
    RETURN v_last_due + (p_frequency_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Function: Check if client has pending assignment for template
CREATE OR REPLACE FUNCTION public.client_has_pending_assignment(
    p_client_id UUID,
    p_template_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.form_assignments
    WHERE client_id = p_client_id
    AND template_id = p_template_id
    AND status IN ('pending', 'in_progress');
    
    RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Function: Get template analytics for coach
CREATE OR REPLACE FUNCTION public.get_template_analytics(
    p_template_id UUID,
    p_coach_id UUID
)
RETURNS TABLE (
    total_assignments BIGINT,
    completed_assignments BIGINT,
    pending_assignments BIGINT,
    overdue_assignments BIGINT,
    completion_rate NUMERIC,
    avg_completion_minutes NUMERIC,
    question_stats JSONB
) AS $$
BEGIN
    -- This function is SECURITY DEFINER and callable directly via PostgREST,
    -- so it must enforce that the caller may only read their own analytics.
    IF p_coach_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'Not authorized to read analytics for this coach';
    END IF;

    RETURN QUERY
    WITH assignments AS (
        SELECT fa.*
        FROM public.form_assignments fa
        JOIN public.clients c ON c.id = fa.client_id
        WHERE fa.template_id = p_template_id
        AND c.coach_id = p_coach_id
    ),
    completion_stats AS (
        SELECT 
            COUNT(*) AS total_assignments,
            COUNT(*) FILTER (WHERE status = 'completed') AS completed_assignments,
            COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress')) AS pending_assignments,
            COUNT(*) FILTER (WHERE status = 'overdue') AS overdue_assignments,
            CASE 
                WHEN COUNT(*) > 0 
                THEN COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*) * 100
                ELSE 0 
            END AS completion_rate,
            AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60) FILTER (WHERE status = 'completed') AS avg_completion_minutes
        FROM assignments
    ),
    question_stats AS (
        SELECT jsonb_agg(jsonb_build_object(
            'question_id', fq.id,
            'label_ar', fq.label_ar,
            'label_en', fq.label_en,
            'type', fq.type,
            'response_count', COUNT(fr.id),
            -- Response values are stored as bare JSONB scalars (e.g. 5, "opt_a", true),
            -- so extract the scalar text with #>> '{}' before casting/grouping.
            'avg_value', CASE
                WHEN fq.type IN ('number', 'scale') THEN AVG((fr.value #>> '{}')::NUMERIC)
                ELSE NULL
            END,
            'option_distribution', CASE
                WHEN fq.type IN ('select', 'multiselect', 'radio') THEN (
                    SELECT jsonb_object_agg(opt.value, cnt)
                    FROM (
                        SELECT fr.value #>> '{}' AS value, COUNT(*) AS cnt
                        FROM public.form_responses fr
                        JOIN assignments a ON a.id = fr.assignment_id
                        WHERE fr.question_id = fq.id
                        AND fr.is_draft = false
                        GROUP BY fr.value #>> '{}'
                    ) opt
                )
                ELSE NULL
            END
        )) AS stats
        FROM public.form_questions fq
        LEFT JOIN public.form_responses fr ON fr.question_id = fq.id
        LEFT JOIN assignments a ON a.id = fr.assignment_id
        WHERE fq.template_id = p_template_id
        GROUP BY fq.id
    )
    SELECT 
        cs.total_assignments,
        cs.completed_assignments,
        cs.pending_assignments,
        cs.overdue_assignments,
        cs.completion_rate,
        cs.avg_completion_minutes,
        COALESCE(qs.stats, '[]'::JSONB) AS question_stats
    FROM completion_stats cs
    CROSS JOIN question_stats qs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_next_recurring_due_date(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_has_pending_assignment(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_template_analytics(UUID, UUID) TO authenticated;
-- Storage Buckets and Policies for Forms and Avatars
-- Migration: 20260612_04_storage_policies.sql

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('form-files', 'form-files', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- form-files policies
-- Coach can read all files for their clients' form responses
CREATE POLICY "Coach read clients form files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'form-files' AND
        EXISTS (
            SELECT 1 FROM public.form_files ff
            JOIN public.form_responses fr ON fr.id = ff.response_id
            JOIN public.form_assignments fa ON fa.id = fr.assignment_id
            JOIN public.clients c ON c.id = fa.client_id
            WHERE c.coach_id = auth.uid()
            AND ff.storage_path = storage.objects.name
        )
    );

-- Client can read own form files
CREATE POLICY "Client read own form files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'form-files' AND
        EXISTS (
            SELECT 1 FROM public.form_files ff
            JOIN public.form_responses fr ON fr.id = ff.response_id
            JOIN public.form_assignments fa ON fa.id = fr.assignment_id
            WHERE fa.client_id = auth.uid()
            AND ff.storage_path = storage.objects.name
        )
    );

-- Client can upload form files
CREATE POLICY "Client upload form files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'form-files' AND
        auth.uid() IS NOT NULL AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Client can update own form files (replace)
CREATE POLICY "Client update own form files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'form-files' AND
        EXISTS (
            SELECT 1 FROM public.form_files ff
            JOIN public.form_responses fr ON fr.id = ff.response_id
            JOIN public.form_assignments fa ON fa.id = fr.assignment_id
            WHERE fa.client_id = auth.uid()
            AND ff.storage_path = storage.objects.name
        )
    );

-- Client can delete own form files
CREATE POLICY "Client delete own form files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'form-files' AND
        EXISTS (
            SELECT 1 FROM public.form_files ff
            JOIN public.form_responses fr ON fr.id = ff.response_id
            JOIN public.form_assignments fa ON fa.id = fr.assignment_id
            WHERE fa.client_id = auth.uid()
            AND ff.storage_path = storage.objects.name
        )
    );

-- Coach can delete form files for their clients
CREATE POLICY "Coach delete clients form files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'form-files' AND
        EXISTS (
            SELECT 1 FROM public.form_files ff
            JOIN public.form_responses fr ON fr.id = ff.response_id
            JOIN public.form_assignments fa ON fa.id = fr.assignment_id
            JOIN public.clients c ON c.id = fa.client_id
            WHERE c.coach_id = auth.uid()
            AND ff.storage_path = storage.objects.name
        )
    );

-- avatars policies
-- Public read access for avatars
CREATE POLICY "Public read avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- Authenticated users can upload their own avatar
CREATE POLICY "User upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid() IS NOT NULL AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can update their own avatar
CREATE POLICY "User update own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' AND
        auth.uid() IS NOT NULL AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can delete their own avatar
CREATE POLICY "User delete own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' AND
        auth.uid() IS NOT NULL AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
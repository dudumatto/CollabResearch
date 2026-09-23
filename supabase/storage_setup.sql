-- CollabResearch Supabase Storage bootstrap.
-- Run this in the Supabase SQL editor for the target project.
--
-- The current web upload flow uses the public anon key directly for the
-- `documents` bucket. Keep that bucket limited to safe MIME types and size.
-- For stricter access control, move all user document uploads through the
-- Spring backend and remove the anon/authenticated INSERT policy below.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'documents',
    'documents',
    true,
    5242880,
    array['application/pdf', 'image/jpeg', 'image/png']
  ),
  (
    'project-deliveries',
    'project-deliveries',
    false,
    10485760,
    array['application/pdf', 'image/jpeg', 'image/png']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "collabresearch_documents_public_read" on storage.objects;
create policy "collabresearch_documents_public_read"
on storage.objects
for select
to public
using (bucket_id = 'documents');

drop policy if exists "collabresearch_documents_public_insert" on storage.objects;
create policy "collabresearch_documents_public_insert"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'documents'
  and lower(storage.extension(name)) in ('pdf', 'jpg', 'jpeg', 'png')
);

-- No public policies are created for `project-deliveries`.
-- The backend accesses it with SUPABASE_SERVICE_ROLE_KEY and serves signed URLs.

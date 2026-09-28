-- CollabResearch Supabase Storage bootstrap.
-- Run this in the Supabase SQL editor for the target project.
--
-- User documents are private. Uploads must go through the authenticated Spring API,
-- which uses the service-role key after checking document ownership.
-- Public profile pictures live in a separate bucket and contain no user documents.

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
    false,
    5242880,
    array['application/pdf', 'image/jpeg', 'image/png']
  ),
  (
    'avatars',
    'avatars',
    true,
    2097152,
    array['image/jpeg', 'image/png']
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
drop policy if exists "collabresearch_documents_public_insert" on storage.objects;
drop policy if exists "collabresearch_documents_authenticated_insert" on storage.objects;
drop policy if exists "collabresearch_avatars_public_read" on storage.objects;

-- No public policies are created for `project-deliveries`.
-- The backend accesses private buckets with SUPABASE_SERVICE_ROLE_KEY and serves
-- short-lived signed document URLs. `avatars` is public by design.

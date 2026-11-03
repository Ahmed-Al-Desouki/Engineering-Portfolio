# VALEX admin setup

The admin area uses Supabase Auth and Postgres with row-level security for page content, projects, and media metadata. Cloudinary Free stores and delivers original image/video files. The database stores their URLs, Cloudinary asset IDs, type, and byte size. No service-role key or Cloudinary API secret is exposed in browser code.

1. Create a Supabase Free project and copy its Project URL and publishable key to a local `.env.local` file using `.env.example` as the template.
2. Create a Cloudinary Free account and add the cloud name, API key, and API secret to `.env.local`. Keep the secret server-side.
3. In Supabase SQL Editor, run `migrations/0001_admin_content.sql`.
4. In Supabase Authentication, create an admin user with email and password (public sign-up is not used by this app).
5. Copy that user's UUID from Authentication > Users and add them to the allowlist:

   ```sql
   insert into public.admin_users (user_id)
   values ('PASTE-AUTH-USER-UUID-HERE');
   ```

6. Restart the Next.js dev server and visit `/admin`.

The database starts with no content rows. The dashboard presents the current site's copy and sample project as editable defaults. Saving site content or a project creates the managed database row. The included project is explicitly marked as preview and is saved as a draft if you choose to create it. Published site-content and project records are then read by the public pages; drafts remain private to admins.

## Media limits

Signed Cloudinary uploads keep the API secret on the server. The dashboard enforces 10 MiB per image, 30 MiB per video, and 100 MiB total for each site/project folder; uploaded size is checked against Cloudinary's Admin API before the asset is registered. Only allowlisted admins can request signatures, register assets, or delete files. Public pages read image/video URLs from project/content records and do not need access to the media registry.

Cloudinary's Free plan currently grants 25 monthly credits shared by storage, transformations, and delivery bandwidth. Monitor its usage panel: a 100 MB folder cap limits uploaded files but does not cap monthly viewing bandwidth or transformations.

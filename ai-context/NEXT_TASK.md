# Next Task

All modules are complete. Next steps could be:

1. Apply pending SQL migrations to the live Supabase project:
   - Run `supabase/migrations/001_documents.sql` in Supabase SQL Editor (creates `documents` table, storage bucket, RLS)
   - Run `ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp text;`
2. Turn off email confirmation in Supabase Dashboard (or configure SMTP)
3. Add dashboard widgets for Tasks (overdue tasks count, recent tasks)
4. Add task count/overdue info to ProjectCards
5. Polish UI (responsive refinements, empty states)
6. Deploy

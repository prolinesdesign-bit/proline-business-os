# Next Task

All modules are complete. Next steps could be:

1. Apply pending SQL migrations to the live Supabase project:
   - Run `supabase/migrations/001_documents.sql` in Supabase SQL Editor
   - Run `supabase/migrations/002_follow_ups.sql` in Supabase SQL Editor (creates `follow_ups` table + RLS)
   - Run `ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp text;`
2. Turn off email confirmation in Supabase Dashboard (or configure SMTP)
3. Add task count/overdue info to ProjectCards
4. Polish UI (responsive refinements, empty states)
5. Deploy

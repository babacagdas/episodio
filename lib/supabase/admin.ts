import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return null;

  return createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;

  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.toLowerCase());
}

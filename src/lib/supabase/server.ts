import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://demo.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'demo-service-role-key';

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}


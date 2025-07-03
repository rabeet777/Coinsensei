// src/lib/supabaseAdmin.ts
// src/lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,       // still public URL
  process.env.SUPABASE_SERVICE_ROLE_KEY!        // ← your service_role key, *not* NEXT_PUBLIC_
)


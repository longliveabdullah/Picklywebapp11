import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/lib/database.types"

/** Prefer `import { supabase } from "@/lib/supabase"` for a shared singleton. */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

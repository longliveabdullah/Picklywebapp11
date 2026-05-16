import { createBrowserClient } from "@supabase/ssr"
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local (see .env.example).",
  )
}

/**
 * Browser client (@supabase/ssr). Persists auth in cookies when paired with root `middleware.ts`,
 * so Route Handlers using `createClient()` from `@/lib/supabase/server` see `getUser()`.
 */
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

/** Service role — server-only bypass RLS (admin jobs). Never import in client components. */
export const createServerSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for server client.",
    )
  }
  return createSupabaseJsClient<Database>(url, serviceRoleKey)
}

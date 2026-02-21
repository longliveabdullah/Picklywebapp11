# Page snapshot

\`\`\`yaml
- dialog "Unhandled Runtime Error":
  - navigation:
    - button "previous" [disabled]:
      - img "previous"
    - button "next" [disabled]:
      - img "next"
    - text: 1 of 1 error
  - button "Close"
  - heading "Unhandled Runtime Error" [level=1]
  - paragraph: "Error: supabaseUrl is required."
  - heading "Source" [level=2]
  - link "lib/supabase.ts (7:48) @ supabaseUrl":
    - text: lib/supabase.ts (7:48) @ supabaseUrl
    - img
  - text: "5 | const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! 6 | > 7 | export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey) | ^ 8 | 9 | // Server-side client for API routes 10 | export const createServerSupabaseClient = () => {"
  - heading "Call Stack" [level=2]
  - button "Show collapsed frames"
\`\`\`

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/** GET /api/badges — catalog + user earned state */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: catalog, error: catErr } = await supabase
    .from("badges")
    .select("code, name, description, icon")
    .order("code")

  if (catErr) return NextResponse.json({ error: catErr.message }, { status: 500 })

  if (!user) return NextResponse.json({ badges: catalog?.map((b) => ({ ...b, earned: false })) ?? [] })

  const { data: earned } = await supabase
    .from("user_badges")
    .select("badge_code, earned_at")
    .eq("user_id", user.id)

  const earnedSet = new Set((earned ?? []).map((e) => e.badge_code))
  const earnedMap = Object.fromEntries((earned ?? []).map((e) => [e.badge_code, e.earned_at]))

  return NextResponse.json({
    badges: (catalog ?? []).map((b) => ({
      ...b,
      earned: earnedSet.has(b.code),
      earned_at: earnedMap[b.code] ?? null,
    })),
  })
}

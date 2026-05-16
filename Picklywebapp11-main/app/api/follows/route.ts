import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/** GET /api/follows?user_id=<uuid> — follower + following counts */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("user_id")
  if (!userId) return NextResponse.json({ error: "user_id required" }, { status: 400 })

  const { data, error } = await supabase
    .from("v_user_follow_counts")
    .select("followers, following")
    .eq("user_id", userId)
    .single()

  if (error) return NextResponse.json({ followers: 0, following: 0 })
  return NextResponse.json({ followers: data?.followers ?? 0, following: data?.following ?? 0 })
}

/** POST /api/follows — follow { followee_id } */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const followeeId: string = body?.followee_id ?? ""
  if (!followeeId) return NextResponse.json({ error: "followee_id required" }, { status: 400 })
  if (followeeId === user.id) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })

  const { error } = await supabase
    .from("user_follows")
    .insert({ follower_id: user.id, followee_id: followeeId })

  if (error && error.code !== "23505") return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ following: true })
}

/** DELETE /api/follows — unfollow { followee_id } */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const followeeId: string = body?.followee_id ?? ""
  if (!followeeId) return NextResponse.json({ error: "followee_id required" }, { status: 400 })

  await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("followee_id", followeeId)

  return NextResponse.json({ following: false })
}

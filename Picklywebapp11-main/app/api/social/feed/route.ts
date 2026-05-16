import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/** GET /api/social/feed?limit=20&before=<created_at ISO> */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50)
  const before = searchParams.get("before")

  let query = supabase
    .from("feed_posts")
    .select("id, user_id, body, image_path, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (before) query = query.lt("created_at", before)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts: data ?? [] })
}

/** POST /api/social/feed — create post */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const text: string = typeof body?.body === "string" ? body.body.trim() : ""
  if (!text || text.length > 2000) {
    return NextResponse.json({ error: "body must be 1–2000 characters" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("feed_posts")
    .insert({ user_id: user.id, body: text, image_path: body?.image_path ?? null })
    .select("id, user_id, body, image_path, created_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data }, { status: 201 })
}

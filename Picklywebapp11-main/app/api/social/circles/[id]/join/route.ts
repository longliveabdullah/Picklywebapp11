import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/** POST /api/social/circles/:id/join */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { error } = await supabase
    .from("circle_members")
    .insert({ circle_id: params.id, user_id: user.id })

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ joined: true })
}

/** DELETE /api/social/circles/:id/join */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await supabase
    .from("circle_members")
    .delete()
    .eq("circle_id", params.id)
    .eq("user_id", user.id)

  return NextResponse.json({ left: true })
}

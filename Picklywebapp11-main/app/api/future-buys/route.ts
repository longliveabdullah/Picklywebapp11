import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/** GET /api/future-buys */
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("user_future_buys")
    .select("id, scan_id, product_name, snapshot, added_at")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

/** POST /api/future-buys — { scan_id?, product_name?, snapshot? } */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)

  const { data, error } = await supabase
    .from("user_future_buys")
    .insert({
      user_id: user.id,
      scan_id: body?.scan_id ?? null,
      product_name: body?.product_name ?? null,
      snapshot: body?.snapshot ?? {},
    })
    .select("id, scan_id, product_name, snapshot, added_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data }, { status: 201 })
}

/** DELETE /api/future-buys/:id */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const id: string = body?.id ?? ""
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  await supabase.from("user_future_buys").delete().eq("id", id).eq("user_id", user.id)
  return NextResponse.json({ deleted: true })
}

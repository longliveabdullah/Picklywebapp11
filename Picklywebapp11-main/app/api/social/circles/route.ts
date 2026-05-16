import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/** GET /api/social/circles — list all circles with member counts */
export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("circles")
    .select("id, slug, name, description, accent, created_at")
    .order("name")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ circles: data ?? [] })
}

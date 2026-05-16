import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { productFingerprint, normalizeProductName } from "@/lib/pickly-analyze/fingerprint"

const BodySchema = z.object({
  event_type: z.enum(["scan_dismissed", "added_to_shelf", "added_to_routine"]),
  category: z.string().min(1),
  product_name: z.string().min(1),
  metadata: z.record(z.string(), z.any()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const category = parsed.data.category.trim()
    const product_name = parsed.data.product_name.trim()
    const fingerprint = productFingerprint(category, product_name)

    const { error } = await supabase.from("user_scan_decisions").insert({
      user_id: user.id,
      fingerprint,
      category,
      normalized_name: normalizeProductName(product_name),
      event_type: parsed.data.event_type,
      metadata: parsed.data.metadata ?? {},
    })

    if (error) {
      console.warn("[scan-decisions]", error.message)
      return NextResponse.json({ error: "Could not persist decision", details: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, fingerprint })
  } catch (error) {
    console.error("[scan-decisions]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

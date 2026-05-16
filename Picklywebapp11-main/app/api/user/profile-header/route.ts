import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { resolveDisplayName } from "@/lib/display-name-resolve"
import { MAX_DISPLAY_NAME_LENGTH } from "@/lib/display-name-storage"
import { MAX_BIO_LENGTH } from "@/lib/profile-bio"
import { oauthAvatarFromMetadata } from "@/lib/profile-avatar"

async function upsertProfileFields(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  fields: { display_name?: string; bio?: string | null; avatar_url?: string | null },
) {
  const now = new Date().toISOString()
  const { data: existing } = await supabase.from("user_profiles").select("user_id").eq("user_id", userId).maybeSingle()

  if (existing) {
    const { error } = await supabase.from("user_profiles").update({ ...fields, updated_at: now }).eq("user_id", userId)
    if (error) throw error
  } else {
    const { error } = await supabase.from("user_profiles").insert({ user_id: userId, ...fields, updated_at: now })
    if (error) throw error
  }
}

/** GET /api/user/profile-header — display name + bio */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profileRow } = await supabase
    .from("user_profiles")
    .select("display_name, bio, avatar_url, user_id")
    .eq("user_id", user.id)
    .maybeSingle()

  const storedName = profileRow?.display_name?.trim() || null
  const storedBio = profileRow?.bio?.trim() || null
  const storedAvatar = profileRow?.avatar_url?.trim() || null
  const oauthAvatar = oauthAvatarFromMetadata(user.user_metadata as Record<string, unknown>)

  let displayName = storedName
  let namePersisted = Boolean(storedName)

  if (!displayName) {
    const resolved = resolveDisplayName({
      metadata: user.user_metadata as Record<string, unknown>,
      email: user.email,
      userId: user.id,
    })
    if (resolved) {
      displayName = resolved
      namePersisted = true
      await upsertProfileFields(supabase, user.id, { display_name: resolved })
    }
  }

  return NextResponse.json({
    displayName,
    bio: storedBio,
    avatarUrl: storedAvatar ?? oauthAvatar,
    namePersisted,
    bioPersisted: Boolean(storedBio),
    avatarPersisted: Boolean(storedAvatar),
  })
}

/** PATCH /api/user/profile-header — { displayName?: string, bio?: string | null } */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const hasName = typeof body?.displayName === "string"
  const hasBio = body?.bio !== undefined

  if (!hasName && !hasBio) {
    return NextResponse.json({ error: "Provide displayName and/or bio" }, { status: 400 })
  }

  const fields: { display_name?: string; bio?: string | null } = {}

  if (hasName) {
    const trimmed = (body.displayName as string).trim().slice(0, MAX_DISPLAY_NAME_LENGTH)
    if (!trimmed) {
      return NextResponse.json({ error: "displayName must be 1–50 characters" }, { status: 400 })
    }
    fields.display_name = trimmed
  }

  if (hasBio) {
    const raw = body.bio === null ? "" : String(body.bio)
    const trimmed = raw.trim().slice(0, MAX_BIO_LENGTH)
    fields.bio = trimmed.length > 0 ? trimmed : null
  }

  try {
    await upsertProfileFields(supabase, user.id, fields)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save"
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const { data: row } = await supabase
    .from("user_profiles")
    .select("display_name, bio, avatar_url")
    .eq("user_id", user.id)
    .maybeSingle()

  return NextResponse.json({
    displayName: row?.display_name?.trim() ?? null,
    bio: row?.bio?.trim() ?? null,
    avatarUrl: row?.avatar_url?.trim() ?? null,
  })
}

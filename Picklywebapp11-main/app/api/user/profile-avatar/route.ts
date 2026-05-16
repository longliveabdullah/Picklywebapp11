import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  ALLOWED_AVATAR_MIME_TYPES,
  MAX_AVATAR_BYTES,
  PROFILE_PICTURES_BUCKET,
  avatarStoragePath,
  extensionForMime,
  publicAvatarUrl,
} from "@/lib/profile-avatar"

async function saveAvatarUrl(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, avatarUrl: string | null) {
  const now = new Date().toISOString()
  const { data: existing } = await supabase.from("user_profiles").select("user_id").eq("user_id", userId).maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from("user_profiles")
      .update({ avatar_url: avatarUrl, updated_at: now })
      .eq("user_id", userId)
    if (error) throw error
  } else {
    const { error } = await supabase.from("user_profiles").insert({
      user_id: userId,
      avatar_url: avatarUrl,
      updated_at: now,
    })
    if (error) throw error
  }
}

/** POST /api/user/profile-avatar — multipart field `file` */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
  }

  const formData = await request.formData().catch(() => null)
  const file = formData?.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 })
  }

  if (!ALLOWED_AVATAR_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Use JPEG, PNG, WebP, or GIF" }, { status: 400 })
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return NextResponse.json({ error: "Image must be 2 MB or smaller" }, { status: 400 })
  }

  const ext = extensionForMime(file.type)
  if (!ext) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 })
  }

  const path = avatarStoragePath(user.id, ext)
  const bytes = new Uint8Array(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage.from(PROFILE_PICTURES_BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: true,
    cacheControl: "3600",
  })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const avatarUrl = `${publicAvatarUrl(supabaseUrl, path)}?v=${Date.now()}`

  try {
    await saveAvatarUrl(supabase, user.id, avatarUrl)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save profile"
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ avatarUrl })
}

/** DELETE /api/user/profile-avatar — remove photo from bucket + DB */
export async function DELETE() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: files } = await supabase.storage.from(PROFILE_PICTURES_BUCKET).list(user.id)
  if (files?.length) {
    const paths = files.map((f) => `${user.id}/${f.name}`)
    await supabase.storage.from(PROFILE_PICTURES_BUCKET).remove(paths)
  }

  try {
    await saveAvatarUrl(supabase, user.id, null)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile"
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ avatarUrl: null })
}

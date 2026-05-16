"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import {
  getDefaultDisplayName,
  readStoredDisplayName,
  writeStoredDisplayName,
  MAX_DISPLAY_NAME_LENGTH,
} from "@/lib/display-name-storage"
import { MAX_BIO_LENGTH } from "@/lib/profile-bio"

export function useProfileHeader(userId: string | undefined, email?: string | null) {
  const { user, updateUser } = useAuth()
  const fallback = getDefaultDisplayName(email, userId)
  const [displayName, setDisplayNameState] = useState(
    () => user?.profile?.displayName?.trim() || fallback,
  )
  const [bio, setBioState] = useState(() => user?.profile?.bio?.trim() || "")
  const [avatarUrl, setAvatarUrlState] = useState<string | null>(user?.profile?.avatarUrl ?? null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const loadedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setDisplayNameState(getDefaultDisplayName(email))
      setBioState("")
      setAvatarUrlState(null)
      return
    }

    if (user?.profile?.displayName) setDisplayNameState(user.profile.displayName)
    if (user?.profile?.bio) setBioState(user.profile.bio)
    if (user?.profile?.avatarUrl) setAvatarUrlState(user.profile.avatarUrl)

    if (loadedRef.current === userId) return

    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch("/api/user/profile-header")
        if (!res.ok || cancelled) return

        const data = (await res.json()) as {
          displayName?: string
          bio?: string | null
          avatarUrl?: string | null
          namePersisted?: boolean
        }

        if (data.displayName) setDisplayNameState(data.displayName)
        if (data.bio) setBioState(data.bio)
        if (data.avatarUrl) setAvatarUrlState(data.avatarUrl)

        if (!data.namePersisted) {
          const local = readStoredDisplayName(userId)
          if (local) {
            await fetch("/api/user/profile-header", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ displayName: local }),
            })
            if (!cancelled) setDisplayNameState(local)
          }
        }

        const profilePatch: { displayName?: string; bio?: string; avatarUrl?: string } = {}
        if (data.displayName && user?.profile?.displayName !== data.displayName) {
          profilePatch.displayName = data.displayName
        }
        if (data.bio && user?.profile?.bio !== data.bio) {
          profilePatch.bio = data.bio
        }
        if (data.avatarUrl && user?.profile?.avatarUrl !== data.avatarUrl) {
          profilePatch.avatarUrl = data.avatarUrl
        }
        if (Object.keys(profilePatch).length > 0) {
          void updateUser({ profile: profilePatch })
        }

        loadedRef.current = userId
      } catch {
        if (!cancelled) {
          const stored = readStoredDisplayName(userId)
          setDisplayNameState(stored ?? getDefaultDisplayName(email, userId))
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [userId, email, user?.profile?.displayName, user?.profile?.bio, user?.profile?.avatarUrl, updateUser])

  const setDisplayName = useCallback(
    async (name: string) => {
      const trimmed = name.trim().slice(0, MAX_DISPLAY_NAME_LENGTH)
      if (!trimmed || !userId) return false

      setDisplayNameState(trimmed)
      writeStoredDisplayName(userId, trimmed)

      try {
        const res = await fetch("/api/user/profile-header", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: trimmed }),
        })
        if (!res.ok) return false
        await updateUser({ profile: { displayName: trimmed } })
        return true
      } catch {
        return false
      }
    },
    [userId, updateUser],
  )

  const setBio = useCallback(
    async (text: string) => {
      if (!userId) return false
      const trimmed = text.trim().slice(0, MAX_BIO_LENGTH)

      setBioState(trimmed)

      try {
        const res = await fetch("/api/user/profile-header", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bio: trimmed || null }),
        })
        if (!res.ok) return false
        await updateUser({ profile: { bio: trimmed || undefined } })
        return true
      } catch {
        return false
      }
    },
    [userId, updateUser],
  )

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!userId) return false
      setIsUploadingAvatar(true)
      try {
        const formData = new FormData()
        formData.append("file", file)
        const res = await fetch("/api/user/profile-avatar", { method: "POST", body: formData })
        const data = (await res.json()) as { avatarUrl?: string; error?: string }
        if (!res.ok || !data.avatarUrl) return false
        setAvatarUrlState(data.avatarUrl)
        await updateUser({ profile: { avatarUrl: data.avatarUrl } })
        return true
      } catch {
        return false
      } finally {
        setIsUploadingAvatar(false)
      }
    },
    [userId, updateUser],
  )

  const removeAvatar = useCallback(async () => {
    if (!userId) return false
    setIsUploadingAvatar(true)
    try {
      const res = await fetch("/api/user/profile-avatar", { method: "DELETE" })
      if (!res.ok) return false
      setAvatarUrlState(null)
      await updateUser({ profile: { avatarUrl: undefined } })
      return true
    } catch {
      return false
    } finally {
      setIsUploadingAvatar(false)
    }
  }, [userId, updateUser])

  return { displayName, bio, avatarUrl, isUploadingAvatar, setDisplayName, setBio, uploadAvatar, removeAvatar }
}

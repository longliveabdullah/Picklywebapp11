"use client"

import { useProfileHeader } from "@/hooks/use-profile-header"

/** @deprecated Prefer useProfileHeader for name + bio */
export function useDisplayName(userId: string | undefined, email?: string | null) {
  const { displayName, setDisplayName } = useProfileHeader(userId, email)
  return { displayName, setDisplayName }
}

"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

type ProfileAvatarProps = {
  displayName: string
  avatarUrl?: string | null
  size?: "sm" | "lg"
  className?: string
}

const sizeClasses = {
  sm: { box: "h-10 w-10", text: "text-sm", ring: "" },
  lg: { box: "h-24 w-24", text: "text-3xl", ring: "ring-4 ring-[#A7AD89]/30" },
}

export function ProfileAvatar({ displayName, avatarUrl, size = "sm", className }: ProfileAvatarProps) {
  const s = sizeClasses[size]
  const initial = displayName[0]?.toUpperCase() ?? "?"

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#697254]",
        s.box,
        s.ring,
        className,
      )}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt="" fill className="object-cover" sizes={size === "lg" ? "96px" : "40px"} />
      ) : (
        <span className={cn("font-bold text-[#EFE5D8]", s.text)}>{initial}</span>
      )}
    </div>
  )
}

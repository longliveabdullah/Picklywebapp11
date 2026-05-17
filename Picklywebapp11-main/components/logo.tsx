import Image from "next/image"
import Link from "next/link"

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: 32,
    md: 48,
    lg: 64,
  }

  return (
    <Link href="/" className="flex items-center justify-center">
      <Image
        src="/images/pickly-newlogov2.png"
        alt="Pickly Logo"
        width={sizes[size]}
        height={sizes[size]}
        className="object-contain rounded-full drop-shadow-[0_2px_8px_rgba(105,114,84,0.35)]"
      />
    </Link>
  )
}

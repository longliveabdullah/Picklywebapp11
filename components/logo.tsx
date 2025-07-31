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
        src="/images/logo.png"
        alt="Pickly Logo"
        width={sizes[size]}
        height={sizes[size]}
        className="object-contain"
      />
    </Link>
  )
}

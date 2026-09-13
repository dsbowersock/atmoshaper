import Image from "next/image"
import Link from "next/link"
import { PUBLIC_PRODUCT_IDENTITY } from "@/lib/public-product-identity"
import { cn } from "@/lib/utils"

export function AppBarBrandLink({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={PUBLIC_PRODUCT_IDENTITY.name + " home"}
      className={cn("ml-app-bar-brand", className)}
      data-testid="app-bar-brand"
    >
      <Image
        src={PUBLIC_PRODUCT_IDENTITY.assets.appBarWordmark}
        alt=""
        width={1518}
        height={593}
        className="ml-app-bar-brand-wordmark"
        sizes="144px"
        priority
      />
      <Image
        src={PUBLIC_PRODUCT_IDENTITY.assets.appBarMark}
        alt=""
        width={500}
        height={500}
        className="ml-app-bar-brand-mark"
        sizes="36px"
        priority
      />
    </Link>
  )
}

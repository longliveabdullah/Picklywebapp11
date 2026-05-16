import type { ScanHistoryItem } from "@/types"
import type { SharedShelfProduct } from "@/lib/pickly-mock-data"

export type CompareSide =
  | { kind: "scan"; scan: ScanHistoryItem }
  | { kind: "shelf"; product: SharedShelfProduct }

export function compareSideKey(side: CompareSide): string {
  return side.kind === "scan" ? `scan:${side.scan.id}` : `shelf:${side.product.id}`
}

export function compareSideTitle(side: CompareSide): string {
  if (side.kind === "scan") {
    return side.scan.rating.productName || side.scan.productName || "Scanned product"
  }
  return side.product.product_name
}

export function compareSideSubtitle(side: CompareSide): string {
  return side.kind === "scan" ? "From your scan history" : side.product.brand
}

/** Pickly score when the side comes from a scan with a resolved numeric score. */
export function picklyScoreFromSide(side: CompareSide): number | null {
  if (side.kind !== "scan") return null
  const n = side.scan.rating.rating
  return typeof n === "number" && n >= 0 ? n : null
}

export type CompareVerdict =
  | { winner: "left" | "right"; marginLabel: string }
  | { winner: "tie"; marginLabel: string }
  | { winner: null; marginLabel: string }

/**
 * Only declares a score-based winner when both sides are scans with valid Pickly scores.
 * Otherwise returns guidance without picking a “fake” winner from shelf placeholders.
 */
export function compareVerdictFromSides(left: CompareSide | null, right: CompareSide | null): CompareVerdict | null {
  if (!left || !right) return null

  const ls = picklyScoreFromSide(left)
  const rs = picklyScoreFromSide(right)

  if (ls === null || rs === null) {
    const needsLeft = ls === null
    const needsRight = rs === null
    if (needsLeft && needsRight) {
      return {
        winner: null,
        marginLabel: "Scan both products with the Scanner on Home to unlock a Pickly score comparison.",
      }
    }
    if (needsLeft) {
      return {
        winner: null,
        marginLabel: "Scan your left pick to add a Pickly score — shelf items use price & shelf details until scanned.",
      }
    }
    return {
      winner: null,
      marginLabel: "Scan your right pick to add a Pickly score — shelf items use price & shelf details until scanned.",
    }
  }

  const roundedL = Math.round(ls * 10) / 10
  const roundedR = Math.round(rs * 10) / 10
  if (roundedL === roundedR) {
    return {
      winner: "tie",
      marginLabel: `Both scored ${roundedL}/10 — compare ingredients and price below.`,
    }
  }
  if (ls > rs) {
    return {
      winner: "left",
      marginLabel: `${roundedL}/10 vs ${roundedR}/10 — stronger Pickly score on the left.`,
    }
  }
  return {
    winner: "right",
    marginLabel: `${roundedR}/10 vs ${roundedL}/10 — stronger Pickly score on the right.`,
  }
}

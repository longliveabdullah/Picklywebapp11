import type { SharedShelfProduct, ShelfCategory } from "@/lib/shelf-types"
import { categoryMeta } from "@/lib/shelf-presentation"
import { formatPurchaseDate } from "@/lib/shelf-utils"

export function deriveWalletData(products: SharedShelfProduct[]) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const prevDate = new Date(currentYear, currentMonth - 1, 1)
  const previousMonth = prevDate.getMonth()
  const previousYear = prevDate.getFullYear()

  const currentMonthItems = products.filter((p) => {
    const d = new Date(p.purchase_date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })
  const previousMonthItems = products.filter((p) => {
    const d = new Date(p.purchase_date)
    return d.getMonth() === previousMonth && d.getFullYear() === previousYear
  })

  const monthlySpend = currentMonthItems.reduce((t, p) => t + p.purchase_price, 0)
  const previousMonthlySpend = previousMonthItems.reduce((t, p) => t + p.purchase_price, 0)
  const lastMonthDiff =
    previousMonthlySpend > 0 ? ((monthlySpend - previousMonthlySpend) / previousMonthlySpend) * 100 : 0

  const categoryTotals = currentMonthItems.reduce<Record<ShelfCategory, number>>(
    (acc, p) => { acc[p.category] += p.purchase_price; return acc },
    { skin: 0, makeup: 0, hair: 0, body: 0, fragrance: 0 },
  )

  const breakdownData = (Object.entries(categoryTotals) as [ShelfCategory, number][])
    .filter(([, total]) => total > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([category, total]) => ({
      label: categoryMeta[category].label,
      pct: monthlySpend > 0 ? Math.round((total / monthlySpend) * 100) : 0,
      color: categoryMeta[category].accent,
    }))

  const cleanScore =
    products.length === 0
      ? 0
      : Math.round(products.reduce((s, p) => s + p.clean_score, 0) / products.length)

  const savedAmount = Number(
    (products.filter((p) => p.clean_score >= 88).length * 8.5).toFixed(1),
  )

  const recentPurchases = [...products]
    .sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime())
    .map((p) => ({
      id: p.id,
      name: p.product_name,
      price: p.purchase_price,
      tag: p.tag,
      tagColor: categoryMeta[p.category].accent,
      tagBg: categoryMeta[p.category].accent,
      date: formatPurchaseDate(p.purchase_date),
      icon: p.icon,
    }))

  return { monthlySpend, lastMonthDiff, cleanScore, savedAmount, breakdownData, recentPurchases }
}

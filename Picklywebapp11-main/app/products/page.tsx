"use client"

import type React from "react"
import { useMemo, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, X, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  fragranceMomentMeta,
  routineTypeMeta,
  type FragranceMoment,
  type RoutineType,
  type SharedShelfProduct,
  type ShelfCategory,
} from "@/lib/pickly-mock-data"
import { useSharedShelf } from "@/hooks/use-shared-shelf"

const categories = [
  { value: "skin", label: "Skincare", bg: "bg-[#A7AD89]/15", accent: "#A7AD89", text: "text-[#697254]", icon: "stroke-[#697254]" },
  { value: "makeup", label: "Makeup", bg: "bg-[#B69C85]/15", accent: "#B69C85", text: "text-[#92735C]", icon: "stroke-[#92735C]" },
  { value: "hair", label: "Haircare", bg: "bg-[#8C916C]/15", accent: "#8C916C", text: "text-[#697254]", icon: "stroke-[#697254]" },
  { value: "body", label: "Body", bg: "bg-[#DBD0C4]/40", accent: "#DBD0C4", text: "text-[#92735C]", icon: "stroke-[#92735C]" },
  { value: "fragrance", label: "Fragrance", bg: "bg-[#92735C]/12", accent: "#92735C", text: "text-[#92735C]", icon: "stroke-[#92735C]" },
]

const categoryIcons: Record<string, React.ReactNode> = {
  skin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3C12 3 8 3 8 7v3h8V7c0-4-4-4-4-4z"/>
      <rect x="7" y="10" width="10" height="12" rx="2"/>
      <path d="M7 14h10"/>
    </svg>
  ),
  makeup: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6l2 8H7L9 3z"/>
      <rect x="6" y="11" width="12" height="10" rx="2"/>
      <path d="M10 15h4"/>
    </svg>
  ),
  hair: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6c0-3 4-3 4-3s4 0 4 3v5c0 3-2 5-4 5s-4-2-4-5V6z"/>
      <path d="M10 16v5"/>
      <path d="M14 16v5"/>
      <path d="M8 21h8"/>
    </svg>
  ),
  body: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3"/>
      <path d="M12 8v8"/>
      <path d="M8 12h8"/>
      <path d="M9 20l3-4 3 4"/>
    </svg>
  ),
  fragrance: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="10" width="8" height="11" rx="2"/>
      <path d="M10 10V7h4v3"/>
      <path d="M12 7V4"/>
      <path d="M9 4h6"/>
      <path d="M16 14l2-1"/>
      <path d="M16 17h2"/>
    </svg>
  ),
}

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const { products, addProduct } = useSharedShelf()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setShowAddModal(true)
      window.history.replaceState({}, "", "/products")
    }
  }, [searchParams])

  const [newProduct, setNewProduct] = useState({
    product_name: "",
    brand: "",
    category: "",
    purchase_price: "",
    purchase_date: new Date().toISOString().split("T")[0],
    expiry_date: "",
    period_after_opening: 12,
    status: "sealed" as "sealed" | "opened",
    routine_type: "" as "" | RoutineType,
    fragrance_moment: "" as "" | FragranceMoment,
  })

  const getProductStatus = (product: SharedShelfProduct) => {
    if (!product.expiry_date) return { status: "fresh", color: "#A7AD89", label: "Fresh", bg: "bg-[#A7AD89]/15" }
    const days = Math.ceil((new Date(product.expiry_date).getTime() - Date.now()) / 86400000)
    if (days < 0) return { status: "expired", color: "#C45B4A", label: "Expired", bg: "bg-red-50" }
    if (days <= 30) return { status: "expires_soon", color: "#B69C85", label: "Expires Soon", bg: "bg-[#B69C85]/15" }
    return { status: "fresh", color: "#A7AD89", label: "Fresh", bg: "bg-[#A7AD89]/15" }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsSubmitting(true)
    try {
      addProduct({
        product_name: newProduct.product_name,
        brand: newProduct.brand,
        category: newProduct.category as ShelfCategory,
        purchase_price: Number(newProduct.purchase_price),
        purchase_date: newProduct.purchase_date,
        expiry_date: newProduct.expiry_date || null,
        period_after_opening: newProduct.period_after_opening,
        status: newProduct.status,
        routine_type: newProduct.category === "fragrance" ? undefined : newProduct.routine_type || undefined,
        fragrance_moment: newProduct.category === "fragrance" ? newProduct.fragrance_moment || undefined : undefined,
      })

      toast({ title: "Success", description: "Product added to your shelf!" })
      setShowAddModal(false)
      setNewProduct({
        product_name: "",
        brand: "",
        category: "",
        purchase_price: "",
        purchase_date: new Date().toISOString().split("T")[0],
        expiry_date: "",
        period_after_opening: 12,
        status: "sealed",
        routine_type: "",
        fragrance_moment: "",
      })
    } catch (error) {
      console.error("Error adding product:", error)
      toast({ title: "Error", description: "Failed to add product", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const groupedProducts = categories.reduce((acc, c) => {
    acc[c.value] = filteredProducts.filter((p) => p.category === c.value)
    return acc
  }, {} as Record<string, SharedShelfProduct[]>)

  return (
    <div className="min-h-screen bg-[#F5EFE6] pb-24">
      {/* Header */}
      <div className="px-5 pb-3 pt-5">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#92735C]/10">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 16L7 10L13 4" stroke="#3D3D3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="flex-1 text-xl font-bold text-[#2D2D2D]">My Shelf</h1>
          <span className="rounded-full bg-[#697254]/10 px-3 py-1 text-xs font-bold text-[#697254]">
            {products.length} items
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 pb-4">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92735C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border-0 bg-white py-3 pl-10 pr-4 text-sm text-[#2D2D2D] shadow-sm outline-none placeholder:text-[#92735C]/50 focus:ring-2 focus:ring-[#A7AD89]/40"
          />
        </div>
      </div>

      <div className="px-5">
        {/* Category Grid (no filter selected) */}
        {!selectedCategory && searchQuery === "" ? (
          <div className="grid grid-cols-2 gap-3">
            {categories.map((c) => {
              const count = groupedProducts[c.value]?.length || 0
              return (
                <button
                  key={c.value}
                  onClick={() => setSelectedCategory(c.value)}
                  className={`flex flex-col items-start rounded-2xl p-4 ${c.bg} transition-shadow hover:shadow-md`}
                >
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${c.icon}`} style={{ backgroundColor: `${c.accent}25` }}>
                    {categoryIcons[c.value]}
                  </div>
                  <p className={`text-[14px] font-bold ${c.text}`}>{c.label}</p>
                  <p className="mt-0.5 text-[11px] text-[#92735C]/60">{count} {count === 1 ? "product" : "products"}</p>
                </button>
              )
            })}

          </div>
        ) : (
          /* Product List */
          <div className="space-y-3">
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="mb-1 text-sm font-semibold text-[#697254]"
              >
                ← All categories
              </button>
            )}

            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#DBD0C4]/40">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#92735C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-[#2D2D2D]">No products yet</p>
                <p className="mt-1 text-xs text-[#92735C]/70">Tap + to add your first product</p>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const ps = getProductStatus(product)
                const cat = categories.find((c) => c.value === product.category)
                return (
                  <div key={product.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${cat?.accent || "#A7AD89"}20`, color: cat?.accent || "#697254" }}
                    >
                      {categoryIcons[product.category] || categoryIcons.skin}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-bold text-[#2D2D2D]">{product.product_name}</p>
                      <p className="text-[12px] text-[#92735C]/70">{product.brand}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold text-[#697254]">
                          ${product.purchase_price.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-[#92735C]/50">
                          Bought {new Date(product.purchase_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        {product.category === "fragrance" && product.fragrance_moment && (
                          <span className="rounded-full bg-[#92735C]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#92735C]">
                            {fragranceMomentMeta[product.fragrance_moment].label}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ps.bg}`} style={{ color: ps.color }}>
                        {ps.label}
                      </span>
                      {product.expiry_date && (
                        <span className="text-[10px] text-[#92735C]/50">
                          {new Date(product.expiry_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#697254] shadow-lg"
      >
        <Plus className="h-6 w-6 text-[#EFE5D8]" />
      </button>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl bg-[#F5EFE6]">
            <div className="p-6 pb-24">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#A7AD89]/20">
                    <Plus className="h-5 w-5 text-[#697254]" />
                  </div>
                  <h2 className="text-lg font-bold text-[#2D2D2D]">Add to Shelf</h2>
                </div>
                <button onClick={() => setShowAddModal(false)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#92735C]/10">
                  <X className="h-5 w-5 text-[#3D3D3D]" />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="product_name" className="text-xs font-semibold text-[#697254]">Product Name *</Label>
                  <Input
                    id="product_name"
                    placeholder="e.g., Vitamin C Serum"
                    value={newProduct.product_name}
                    onChange={(e) => setNewProduct((prev) => ({ ...prev, product_name: e.target.value }))}
                    required
                    className="rounded-xl border-[#DBD0C4] bg-white focus:border-[#A7AD89] focus:ring-[#A7AD89]/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="brand" className="text-xs font-semibold text-[#697254]">Brand *</Label>
                  <Input
                    id="brand"
                    placeholder="e.g., The Ordinary"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct((prev) => ({ ...prev, brand: e.target.value }))}
                    required
                    className="rounded-xl border-[#DBD0C4] bg-white focus:border-[#A7AD89] focus:ring-[#A7AD89]/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-xs font-semibold text-[#697254]">Category *</Label>
                  <Select value={newProduct.category} onValueChange={(v) => setNewProduct((prev) => ({ ...prev, category: v }))} required>
                    <SelectTrigger className="rounded-xl border-[#DBD0C4] bg-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="purchase_price" className="text-xs font-semibold text-[#697254]">Price *</Label>
                    <Input
                      id="purchase_price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g., 24.99"
                      value={newProduct.purchase_price}
                      onChange={(e) => setNewProduct((prev) => ({ ...prev, purchase_price: e.target.value }))}
                      required
                      className="rounded-xl border-[#DBD0C4] bg-white focus:border-[#A7AD89] focus:ring-[#A7AD89]/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="purchase_date" className="text-xs font-semibold text-[#697254]">Purchase Date *</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={newProduct.purchase_date}
                      onChange={(e) => setNewProduct((prev) => ({ ...prev, purchase_date: e.target.value }))}
                      required
                      className="rounded-xl border-[#DBD0C4] bg-white focus:border-[#A7AD89] focus:ring-[#A7AD89]/30"
                    />
                  </div>
                </div>

                {newProduct.category === "fragrance" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="fragrance_moment" className="text-xs font-semibold text-[#92735C]">Perfume Slot</Label>
                    <Select
                      value={newProduct.fragrance_moment}
                      onValueChange={(v) => setNewProduct((prev) => ({ ...prev, fragrance_moment: v as "" | FragranceMoment }))}
                    >
                      <SelectTrigger className="rounded-xl border-[#DBD0C4] bg-white">
                        <SelectValue placeholder="Choose Morning, Night, Winter, or Summer" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(fragranceMomentMeta) as [FragranceMoment, { label: string }][]).map(([value, meta]) => (
                          <SelectItem key={value} value={value}>
                            {meta.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="routine_type" className="text-xs font-semibold text-[#697254]">Routine Fit</Label>
                    <Select
                      value={newProduct.routine_type}
                      onValueChange={(v) => setNewProduct((prev) => ({ ...prev, routine_type: v as "" | RoutineType }))}
                    >
                      <SelectTrigger className="rounded-xl border-[#DBD0C4] bg-white">
                        <SelectValue placeholder="Optional: where does it belong?" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(routineTypeMeta) as [RoutineType, { label: string; icon: string }][]).map(([value, meta]) => (
                          <SelectItem key={value} value={value}>
                            {meta.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="rounded-2xl bg-[#DBD0C4]/30 p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#B69C85]" />
                    <h3 className="text-sm font-semibold text-[#2D2D2D]">Expiry Info</h3>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="expiry_date" className="text-xs font-semibold text-[#92735C]">Expiry Date *</Label>
                    <div className="relative">
                      <Input
                        id="expiry_date"
                        type="date"
                        value={newProduct.expiry_date}
                        onChange={(e) => setNewProduct((prev) => ({ ...prev, expiry_date: e.target.value }))}
                        className="rounded-xl border-[#DBD0C4] bg-white pr-10 focus:border-[#B69C85] focus:ring-[#B69C85]/30"
                        required
                      />
                      <Calendar className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B69C85]" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pao" className="text-xs font-semibold text-[#92735C]">Period After Opening *</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="pao"
                        type="number"
                        min="1"
                        max="60"
                        value={newProduct.period_after_opening}
                        onChange={(e) => setNewProduct((prev) => ({ ...prev, period_after_opening: Number.parseInt(e.target.value) }))}
                        className="flex-1 rounded-xl border-[#DBD0C4] bg-white focus:border-[#B69C85] focus:ring-[#B69C85]/30"
                        required
                      />
                      <span className="text-xs font-medium text-[#92735C]">months</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#92735C]">Status *</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewProduct((prev) => ({ ...prev, status: "sealed" }))}
                        className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                          newProduct.status === "sealed"
                            ? "bg-[#697254] text-[#EFE5D8]"
                            : "bg-white text-[#3D3D3D] ring-1 ring-[#DBD0C4]"
                        }`}
                      >
                        Sealed
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewProduct((prev) => ({ ...prev, status: "opened" }))}
                        className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                          newProduct.status === "opened"
                            ? "bg-[#92735C] text-[#EFE5D8]"
                            : "bg-white text-[#3D3D3D] ring-1 ring-[#DBD0C4]"
                        }`}
                      >
                        Opened
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    disabled={isSubmitting}
                    className="flex-1 rounded-2xl py-3.5 text-sm font-semibold text-[#3D3D3D] ring-1 ring-[#DBD0C4] transition-colors hover:bg-white disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-2xl bg-[#697254] py-3.5 text-sm font-semibold text-[#EFE5D8] shadow-md transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Save Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

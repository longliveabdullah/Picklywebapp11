"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, ChevronRight, Plus, X, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string
  product_name: string
  brand: string
  category: string
  expiry_date: string | null
  period_after_opening: number | null
  status: "sealed" | "opened"
  opened_date: string | null
  created_at: string
}

const categories = [
  { value: "skin", label: "Skin", color: "from-green-400 to-green-600" },
  { value: "makeup", label: "Makeup", color: "from-pink-400 to-pink-600" },
  { value: "hair", label: "Hair", color: "from-purple-400 to-purple-600" },
  { value: "body", label: "Body", color: "from-blue-400 to-blue-600" },
  { value: "fragrance", label: "Fragrance", color: "from-yellow-400 to-yellow-600" },
]

export default function ProductsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Add product form state
  const [newProduct, setNewProduct] = useState({
    product_name: "",
    brand: "",
    category: "",
    expiry_date: "",
    period_after_opening: 12,
    status: "sealed" as "sealed" | "opened",
  })

  useEffect(() => {
    if (user) {
      fetchProducts()
    }
  }, [user])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("user_products").select("*").order("created_at", { ascending: false })

      if (error) {
        // If table doesn't exist, create it first
        if (error.code === "42P01") {
          console.log("[v0] user_products table doesn't exist, will show empty state")
          setProducts([])
          return
        }
        throw error
      }
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getProductStatus = (product: Product) => {
    if (!product.expiry_date) return { status: "fresh", color: "border-green-400" }

    const expiryDate = new Date(product.expiry_date)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) {
      return { status: "expired", color: "border-red-400" }
    } else if (daysUntilExpiry <= 30) {
      return { status: "expires_soon", color: "border-orange-400" }
    } else {
      return { status: "fresh", color: "border-green-400" }
    }
  }

  const getStatusBadge = (product: Product) => {
    const { status } = getProductStatus(product)

    if (status === "expired") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ● Expired
        </span>
      )
    } else if (status === "expires_soon") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          ● Expires Soon
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ● Fresh
        </span>
      )
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("user_products").insert({
        user_id: user.id,
        product_name: newProduct.product_name,
        brand: newProduct.brand,
        category: newProduct.category,
        expiry_date: newProduct.expiry_date || null,
        period_after_opening: newProduct.period_after_opening,
        status: newProduct.status,
        opened_date: newProduct.status === "opened" ? new Date().toISOString().split("T")[0] : null,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Product added successfully!",
      })

      setShowAddModal(false)
      setNewProduct({
        product_name: "",
        brand: "",
        category: "",
        expiry_date: "",
        period_after_opening: 12,
        status: "sealed",
      })
      fetchProducts()
    } catch (error) {
      console.error("Error adding product:", error)
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const groupedProducts = categories.reduce(
    (acc, category) => {
      acc[category.value] = filteredProducts.filter((p) => p.category === category.value)
      return acc
    },
    {} as Record<string, Product[]>,
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-cyan-500 rounded"></div>
            <h1 className="text-xl font-semibold text-gray-900">My Products</h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200"
          />
        </div>

        {/* Category View */}
        {!selectedCategory ? (
          <div className="space-y-3">
            {categories.map((category) => {
              const count = groupedProducts[category.value]?.length || 0
              return (
                <div
                  key={category.value}
                  className="bg-white rounded-2xl p-4 border border-gray-200 cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => setSelectedCategory(category.value)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900">{category.label}</span>
                    </div>
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-sm font-medium">
                      {count}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Product List View */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setSelectedCategory(null)}
                className="text-purple-600 hover:text-purple-700"
              >
                ← Back to categories
              </Button>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {categories.find((c) => c.value === selectedCategory)?.label}
                </span>
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-sm font-medium">
                  {groupedProducts[selectedCategory]?.length || 0}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {groupedProducts[selectedCategory]?.map((product) => {
                const { color } = getProductStatus(product)
                return (
                  <div key={product.id} className={`bg-white rounded-2xl p-4 border-2 ${color}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{product.product_name}</h3>
                        <p className="text-gray-600 text-sm">{product.brand}</p>
                        <div className="mt-2 flex items-center gap-2">
                          {getStatusBadge(product)}
                          {product.status === "opened" && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Opened</span>
                          )}
                        </div>
                        {product.expiry_date && (
                          <p className="text-xs text-gray-500 mt-1">
                            Expires:{" "}
                            {new Date(product.expiry_date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                            })}
                          </p>
                        )}
                      </div>
                      <div className={`w-3 h-3 rounded-full ${color.replace("border-", "bg-")}`}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={() => {
          console.log("[v0] Add product button clicked")
          setShowAddModal(true)
        }}
        className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 shadow-lg z-40"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Plus className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Add New Product</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    console.log("[v0] Close modal button clicked")
                    setShowAddModal(false)
                  }}
                  className="p-2"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product_name">Product Name *</Label>
                  <Input
                    id="product_name"
                    placeholder="e.g., Vitamin C Serum"
                    value={newProduct.product_name}
                    onChange={(e) => {
                      console.log("[v0] Product name changed:", e.target.value)
                      setNewProduct((prev) => ({ ...prev, product_name: e.target.value }))
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand *</Label>
                  <Input
                    id="brand"
                    placeholder="e.g., The Ordinary"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct((prev) => ({ ...prev, brand: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={newProduct.category}
                    onValueChange={(value) => setNewProduct((prev) => ({ ...prev, category: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-purple-50 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <h3 className="font-medium text-gray-900">Expiry Information</h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Expiry Date *</Label>
                    <div className="relative">
                      <Input
                        id="expiry_date"
                        type="date"
                        value={newProduct.expiry_date}
                        onChange={(e) => setNewProduct((prev) => ({ ...prev, expiry_date: e.target.value }))}
                        className="pr-10"
                        required
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pao">Period After Opening (PAO) *</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="pao"
                        type="number"
                        min="1"
                        max="60"
                        value={newProduct.period_after_opening}
                        onChange={(e) =>
                          setNewProduct((prev) => ({ ...prev, period_after_opening: Number.parseInt(e.target.value) }))
                        }
                        className="flex-1"
                        required
                      />
                      <span className="text-gray-600 text-sm">months</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Status *</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={newProduct.status === "sealed" ? "default" : "outline"}
                        onClick={() => setNewProduct((prev) => ({ ...prev, status: "sealed" }))}
                        className={newProduct.status === "sealed" ? "bg-purple-600 hover:bg-purple-700" : ""}
                      >
                        Sealed
                      </Button>
                      <Button
                        type="button"
                        variant={newProduct.status === "opened" ? "default" : "outline"}
                        onClick={() => setNewProduct((prev) => ({ ...prev, status: "opened" }))}
                        className={newProduct.status === "opened" ? "bg-purple-600 hover:bg-purple-700" : ""}
                      >
                        Opened
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Product"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

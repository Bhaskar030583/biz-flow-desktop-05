
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity?: number;
}

interface POSProductGridProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];
  filteredProducts: Product[];
  selectedShopId: string;
  onAddToCart: (product: Product) => void;
}

export const POSProductGrid: React.FC<POSProductGridProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  filteredProducts,
  selectedShopId,
  onAddToCart,
}) => {
  return (
    <>
      {/* Category Tabs */}
      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border-b border-slate-200 dark:border-gray-700 px-6 py-3">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 text-button-sm rounded-lg transition-all duration-200 whitespace-nowrap shadow-sm ${
                selectedCategory === category
                  ? "bg-blue-600 dark:bg-blue-500 text-white shadow-md"
                  : "text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-gray-100 bg-white/70 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm"
              }`}
            >
              {category === "all" ? "All Items" : category}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      {searchTerm && (
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm px-6 py-4 border-b border-slate-200 dark:border-gray-700">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-500 h-5 w-5" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-slate-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm text-body-md dark:text-gray-100"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-slate-50/50 to-blue-50/50 dark:from-gray-900/50 dark:to-blue-900/50">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24 text-slate-500 dark:text-gray-400">
            <div className="w-32 h-32 mx-auto mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
              <Search className="h-16 w-16 text-slate-400 dark:text-gray-500" />
            </div>
            <h3 className="text-heading-h3 mb-4 text-slate-700 dark:text-gray-300">
              {selectedShopId 
                ? searchTerm || selectedCategory !== "all"
                  ? "No products found"
                  : "No products available" 
                : "Please select a store"
              }
            </h3>
            <p className="text-body-lg text-slate-500 dark:text-gray-400">
              {searchTerm || selectedCategory !== "all" 
                ? "Try adjusting your search or category filter"
                : "Add products to get started"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className={`cursor-pointer transition-all duration-300 group hover:shadow-lg transform hover:scale-105 ${
                  product.quantity !== undefined && product.quantity <= 0 
                    ? 'border-red-200 dark:border-red-700 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 opacity-80' 
                    : 'border-slate-200 dark:border-gray-600 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:border-blue-300 dark:hover:border-blue-500 shadow-sm hover:bg-white dark:hover:bg-gray-800'
                }`}
                onClick={() => onAddToCart(product)}
              >
                <CardContent className="p-2">
                  <h4 className="text-xs font-medium text-slate-800 dark:text-gray-200 line-clamp-2 min-h-[2rem] mb-2 leading-tight">
                    {product.name}
                  </h4>
                  
                  {product.quantity !== undefined && (
                    <div className="mb-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs py-0.5 px-1.5 shadow-sm ${
                          product.quantity > 10 
                            ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700' 
                            : product.quantity > 0 
                              ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700'
                              : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700'
                        }`}
                      >
                        {product.quantity}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="bg-gradient-to-r from-slate-800 to-slate-700 dark:from-gray-700 dark:to-gray-600 text-white px-2 py-1.5 rounded-md text-center shadow-md">
                    <p className="text-xs font-semibold">
                      ₹{Number(product.price).toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

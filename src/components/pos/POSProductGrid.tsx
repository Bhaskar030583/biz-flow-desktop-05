
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Plus, Minus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity?: number;
  expectedClosing?: number;
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
  showSearch?: boolean;
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
  showSearch = false
}) => {
  const getStockStatus = (quantity?: number) => {
    if (quantity === undefined || quantity === 0) return { status: "out", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" };
    if (quantity <= 5) return { status: "low", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" };
    return { status: "good", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" };
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-gray-800 p-4">
      {/* Search and Filters */}
      <div className="mb-4 space-y-3">
        {showSearch && (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
            />
          </div>
        )}

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full auto-cols-fr grid-flow-col overflow-x-auto bg-gray-100 dark:bg-gray-700">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="px-3 py-1.5 text-xs font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-700"
              >
                {category === "all" ? "All Products" : category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-auto">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <Package className="h-16 w-16 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Products Found</h3>
            <p className="text-center max-w-md">
              {!selectedShopId ? 
                "Please select a store to view products." :
                searchTerm ? 
                  "No products match your search criteria." : 
                  "No products are assigned to this store."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.quantity);
              const isOutOfStock = product.quantity === 0;
              
              return (
                <Card
                  key={product.id}
                  className={`group cursor-pointer transition-all duration-200 hover:shadow-md border ${
                    isOutOfStock 
                      ? 'border-red-200 dark:border-red-800 bg-gray-50 dark:bg-gray-900' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                  onClick={() => !isOutOfStock && onAddToCart(product)}
                >
                  <CardContent className="p-2">
                    <div className="space-y-1.5">
                      {/* Product Name */}
                      <h3 className={`font-semibold text-xs leading-tight ${
                        isOutOfStock ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {product.name}
                      </h3>

                      {/* Price */}
                      <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        ₹{Number(product.price).toFixed(2)}
                      </div>

                      {/* Stock Information - Side by side layout */}
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Avail:</span>
                          <Badge className={`text-xs px-1 py-0 ${stockStatus.color}`}>
                            {product.quantity ?? 0}
                          </Badge>
                        </div>
                        
                        {product.expectedClosing !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Exp:</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300 text-xs">
                              {product.expectedClosing}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Category */}
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {product.category}
                      </Badge>

                      {/* Out of stock indicator */}
                      {isOutOfStock && (
                        <div className="w-full py-1 text-center text-xs text-red-500 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                          Out of Stock
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

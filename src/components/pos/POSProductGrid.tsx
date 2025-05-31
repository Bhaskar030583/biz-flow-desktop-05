
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Plus, ShoppingCart } from "lucide-react";
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
}

export const POSProductGrid: React.FC<POSProductGridProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  filteredProducts,
  selectedShopId,
  onAddToCart
}) => {
  const getStockStatus = (quantity?: number) => {
    if (quantity === undefined || quantity === 0) return { status: "out", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" };
    if (quantity <= 5) return { status: "low", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" };
    return { status: "good", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" };
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-gray-800 p-6">
      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
          />
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-auto overflow-x-auto bg-gray-100 dark:bg-gray-700">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-400"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.quantity);
              const isOutOfStock = product.quantity === 0;
              
              return (
                <Card
                  key={product.id}
                  className={`group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 ${
                    isOutOfStock 
                      ? 'border-red-200 dark:border-red-800 bg-gray-50 dark:bg-gray-900' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                  onClick={() => !isOutOfStock && onAddToCart(product)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Product Name */}
                      <div className="flex items-start justify-between">
                        <h3 className={`font-semibold text-sm leading-tight ${
                          isOutOfStock ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {product.name}
                        </h3>
                        {!isOutOfStock && (
                          <Button
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 p-0 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(product);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Price */}
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        ₹{Number(product.price).toFixed(2)}
                      </div>

                      {/* Stock Information */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">Available:</span>
                          <Badge className={`text-xs px-2 py-1 ${stockStatus.color}`}>
                            {product.quantity ?? 0} units
                          </Badge>
                        </div>
                        
                        {product.expectedClosing !== undefined && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">Expected:</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {product.expectedClosing} units
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Category */}
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>

                      {/* Add to Cart Button */}
                      {!isOutOfStock && (
                        <Button 
                          className="w-full mt-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md transition-all duration-200 font-semibold border-0"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(product);
                          }}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                      )}

                      {isOutOfStock && (
                        <div className="w-full mt-3 py-2 text-center text-xs text-red-500 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
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

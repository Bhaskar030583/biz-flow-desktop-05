
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Package, ShoppingCart, User, History } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity?: number;
}

interface POSMobileViewProps {
  products: Product[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];
  addToCart: (product: Product) => void;
  filteredProducts: Product[];
  storeInfo: any;
  handleQuickStock: () => void;
  setShowCustomerManagement: (show: boolean) => void;
  setShowBillHistory: (show: boolean) => void;
}

export const POSMobileView: React.FC<POSMobileViewProps> = ({
  products,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  addToCart,
  filteredProducts,
  storeInfo,
  handleQuickStock,
  setShowCustomerManagement,
  setShowBillHistory
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <img 
                src="/lovable-uploads/c1c145c9-7010-4fbf-9b2d-d46663dadb23.png" 
                alt="Logo" 
                className="h-6 w-6"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">ABC CAFE</h1>
              {storeInfo && (
                <p className="text-xs text-gray-600">{storeInfo.storeName}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickStock}
              className="p-2"
            >
              <Package className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomerManagement(true)}
              className="p-2"
            >
              <User className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBillHistory(true)}
              className="p-2"
            >
              <History className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 border-gray-300 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Mobile Category Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex space-x-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? "bg-orange-500 text-white"
                  : "text-gray-600 hover:text-gray-900 bg-gray-100"
              }`}
            >
              {category === "all" ? "All" : category}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Products Grid */}
      <div className="p-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-700">No products found</h3>
            <p className="text-sm text-gray-400">Try adjusting your search or category filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className={`cursor-pointer transition-all duration-200 ${
                  product.quantity !== undefined && product.quantity <= 0 
                    ? 'border-red-200 bg-red-50 opacity-75' 
                    : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-md'
                }`}
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-3">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                  
                  <h4 className="font-semibold text-xs mb-1 text-gray-800 line-clamp-2 min-h-[2rem] leading-tight">
                    {product.name}
                  </h4>
                  
                  {product.quantity !== undefined && (
                    <div className="mb-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs py-0.5 px-1.5 ${
                          product.quantity > 10 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : product.quantity > 0 
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {product.quantity}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="bg-gray-900 text-white px-2 py-1.5 rounded text-center">
                    <p className="text-xs font-bold">
                      ₹{Number(product.price).toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

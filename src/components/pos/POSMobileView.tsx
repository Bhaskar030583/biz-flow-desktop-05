
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Enhanced Mobile Header with responsive design */}
      <div className="bg-gradient-to-r from-white to-blue-50 border-b-2 border-blue-100 px-4 sm:px-6 py-4 sm:py-6 shadow-lg">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <img 
                src="/lovable-uploads/c1c145c9-7010-4fbf-9b2d-d46663dadb23.png" 
                alt="Logo" 
                className="h-6 w-6 sm:h-7 sm:w-7"
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                ABC CAFE
              </h1>
              {storeInfo && (
                <p className="text-xs sm:text-sm text-gray-600 font-medium">{storeInfo.storeName}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickStock}
              className="p-2 sm:p-3 bg-white hover:bg-blue-50 border-blue-200 text-blue-700 rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomerManagement(true)}
              className="p-2 sm:p-3 bg-white hover:bg-green-50 border-green-200 text-green-700 rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
            >
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBillHistory(true)}
              className="p-2 sm:p-3 bg-white hover:bg-purple-50 border-purple-200 text-purple-700 rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
            >
              <History className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>

        {/* Enhanced Mobile Search with responsive design */}
        <div className="relative">
          <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 sm:pl-12 h-10 sm:h-12 border-2 border-gray-200 focus:border-blue-500 rounded-lg sm:rounded-xl bg-gray-50 focus:bg-white text-sm sm:text-base shadow-sm transition-all duration-300"
          />
        </div>
      </div>

      <div className="flex">
        {/* Mobile Category Sidebar - Left side with responsive design */}
        <div className="w-12 sm:w-16 bg-white border-r-2 border-gray-100 flex flex-col py-3 sm:py-4 space-y-1 sm:space-y-2 shadow-sm">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`mx-1 sm:mx-2 px-1 sm:px-2 py-2 sm:py-3 text-xs font-bold rounded-md sm:rounded-lg whitespace-nowrap transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105 ${
                selectedCategory === category
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                  : "text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200"
              }`}
              title={category === "all" ? "All" : category}
            >
              {category === "all" ? "All" : category.substring(0, 3).toUpperCase()}
            </button>
          ))}
        </div>

        {/* Enhanced Mobile Products Grid with responsive design */}
        <div className="flex-1 p-3 sm:p-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 sm:py-16 text-gray-500">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-lg">
                <Search className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-700">No products found</h3>
              <p className="text-sm sm:text-base text-gray-400">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {filteredProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className={`cursor-pointer transition-all duration-300 border-2 hover:shadow-xl group transform hover:scale-105 rounded-xl sm:rounded-2xl ${
                    product.quantity !== undefined && product.quantity <= 0 
                      ? 'border-red-300 bg-gradient-to-br from-red-50 to-red-100 opacity-75' 
                      : 'border-gray-200 bg-white hover:border-blue-300 shadow-lg'
                  }`}
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-3 sm:p-4">
                    <h4 className="font-bold text-xs sm:text-sm mb-2 sm:mb-3 text-gray-800 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] leading-tight">
                      {product.name}
                    </h4>
                    
                    {product.quantity !== undefined && (
                      <div className="mb-2 sm:mb-3">
                        <Badge 
                          variant="outline" 
                          className={`text-xs py-1 px-2 sm:px-3 font-bold shadow-sm ${
                            product.quantity > 10 
                              ? 'bg-green-100 text-green-700 border-green-300' 
                              : product.quantity > 0 
                                ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                : 'bg-red-100 text-red-700 border-red-300'
                          }`}
                        >
                          {product.quantity}
                        </Badge>
                      </div>
                    )}
                    
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-2 sm:px-3 py-2 sm:py-3 rounded-lg sm:rounded-xl text-center shadow-lg">
                      <p className="text-xs sm:text-sm font-bold">
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
    </div>
  );
};

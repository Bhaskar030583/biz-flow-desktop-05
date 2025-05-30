
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col overflow-hidden">
      {/* Professional Mobile Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <img 
                src="/lovable-uploads/c1c145c9-7010-4fbf-9b2d-d46663dadb23.png" 
                alt="Logo" 
                className="h-6 w-6"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                ABC CAFE POS
              </h1>
              {storeInfo && (
                <p className="text-xs text-slate-600 font-medium">{storeInfo.storeName}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickStock}
              className="p-2 bg-white hover:bg-blue-50 border-slate-200 text-slate-700 rounded-lg shadow-sm"
            >
              <Package className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomerManagement(true)}
              className="p-2 bg-white hover:bg-green-50 border-slate-200 text-slate-700 rounded-lg shadow-sm"
            >
              <User className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBillHistory(true)}
              className="p-2 bg-white hover:bg-purple-50 border-slate-200 text-slate-700 rounded-lg shadow-sm"
            >
              <History className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Professional Mobile Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 border-slate-200 focus:border-blue-500 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Professional Mobile Category Sidebar */}
        <div className="w-14 bg-white/90 backdrop-blur-sm border-r border-slate-200 flex flex-col py-3 space-y-1 shadow-sm">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`mx-1 px-1 py-3 text-xs font-bold rounded-lg whitespace-nowrap transition-all duration-300 shadow-sm ${
                selectedCategory === category
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100"
              }`}
              title={category === "all" ? "All" : category}
            >
              {category === "all" ? "ALL" : category.substring(0, 3).toUpperCase()}
            </button>
          ))}
        </div>

        {/* Professional Mobile Products Grid */}
        <div className="flex-1 overflow-y-auto p-3 bg-gradient-to-br from-slate-50/30 to-blue-50/30">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <div className="w-20 h-20 mx-auto mb-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                <Search className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-700">No products found</h3>
              <p className="text-base text-slate-400">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className={`cursor-pointer transition-all duration-300 group hover:shadow-xl transform hover:scale-105 ${
                    product.quantity !== undefined && product.quantity <= 0 
                      ? 'border-red-200 bg-gradient-to-br from-red-50 to-red-100 opacity-80' 
                      : 'border-slate-200 bg-white/90 backdrop-blur-sm hover:border-blue-300 shadow-sm hover:bg-white'
                  }`}
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-3">
                    <h4 className="font-semibold text-xs leading-tight mb-3 text-slate-800 line-clamp-2 min-h-[2rem]">
                      {product.name}
                    </h4>
                    
                    {product.quantity !== undefined && (
                      <div className="mb-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs py-0.5 px-1.5 font-semibold shadow-sm ${
                            product.quantity > 10 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : product.quantity > 0 
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {product.quantity}
                        </Badge>
                      </div>
                    )}
                    
                    <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-2 py-1.5 rounded-lg text-center shadow-md">
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
    </div>
  );
};

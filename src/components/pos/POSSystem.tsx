
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Split,
  Banknote,
  Smartphone,
  Calculator,
  Grid3X3,
  Search,
  Grid2X2,
  LayoutGrid,
  UserCheck,
  Store,
  User,
  Coffee,
  UtensilsCrossed,
  Cookie,
  Wine,
  IceCream,
  Users
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { CashPaymentModal } from "./CashPaymentModal";
import { CreditPaymentModal } from "./CreditPaymentModal";
import { SplitPaymentModal } from "./SplitPaymentModal";
import { generateBill } from "@/services/billService";
import { toast } from "sonner";

interface POSItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface StoreInfo {
  storeName: string;
  salespersonName: string;
}

interface POSSystemProps {
  products?: Array<{
    id: string;
    name: string;
    price: number;
    category: string;
    quantity?: number;
  }>;
  storeInfo?: StoreInfo | null;
}

export const POSSystem: React.FC<POSSystemProps> = ({ products = [], storeInfo }) => {
  const [cart, setCart] = useState<POSItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCashModal, setShowCashModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const isMobile = useIsMobile();

  // Category icons mapping
  const categoryIcons = {
    "Starters": UtensilsCrossed,
    "Breakfast": Coffee,
    "Lunch": UtensilsCrossed,
    "Supper": Wine,
    "Desserts": Cookie,
    "Beverages": Coffee,
    "all": LayoutGrid
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        total: product.price
      }];
    });
  };

  const updateQuantity = (id: string, change: number) => {
    setCart(prev => 
      prev.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(0, item.quantity + change);
          return newQuantity === 0 
            ? null 
            : { ...item, quantity: newQuantity, total: newQuantity * item.price };
        }
        return item;
      }).filter(Boolean) as POSItem[]
    );
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const handleCashPayment = () => {
    setShowCashModal(true);
  };

  const handleSplitPayment = () => {
    setShowSplitModal(true);
  };

  const handleCardPayment = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    try {
      await generateBill({
        totalAmount: getTotalAmount(),
        paymentMethod: 'card',
        cartItems: cart,
        storeName: storeInfo?.storeName,
        salespersonName: storeInfo?.salespersonName
      });

      toast.success("Card payment completed and bill generated!");
      setCart([]);
    } catch (error) {
      console.error("Error processing card payment:", error);
      toast.error("Failed to process card payment");
    }
  };

  const handleUPIPayment = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    try {
      await generateBill({
        totalAmount: getTotalAmount(),
        paymentMethod: 'upi',
        cartItems: cart,
        storeName: storeInfo?.storeName,
        salespersonName: storeInfo?.salespersonName
      });

      toast.success("UPI payment completed and bill generated!");
      setCart([]);
    } catch (error) {
      console.error("Error processing UPI payment:", error);
      toast.error("Failed to process UPI payment");
    }
  };

  const handleCreditPayment = () => {
    setShowCreditModal(true);
  };

  const handlePaymentComplete = () => {
    setCart([]);
    setShowCashModal(false);
    setShowCreditModal(false);
    setShowSplitModal(false);
  };

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];

  // Filter products by search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo Section */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center">
              <img 
                src="/lovable-uploads/528f105b-5de5-4806-a64a-99582022753b.png" 
                alt="ABC Cafe Logo" 
                className="w-10 h-10 rounded-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">ABC CAFE</h2>
              <p className="text-sm text-gray-500">Restaurant POS</p>
            </div>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="flex-1 p-4">
          <div className="space-y-2">
            {categories.map(category => {
              const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || LayoutGrid;
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 h-12 ${
                    selectedCategory === category 
                      ? "bg-orange-500 text-white hover:bg-orange-600" 
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  <IconComponent className="h-5 w-5" />
                  {category === "all" ? "All Items" : category}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Store Info */}
        {storeInfo && (
          <div className="p-4 border-t bg-gray-50">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{storeInfo.storeName}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-green-600" />
                <span className="text-gray-600">{storeInfo.salespersonName}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Products Section */}
        <div className="flex-1 p-6">
          {/* Header with Search */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-800">Menu Items</h1>
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Add Customer
              </Button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-4 gap-4 overflow-y-auto">
            {filteredProducts.map(product => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-orange-300"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                    <UtensilsCrossed className="h-12 w-12 text-gray-400" />
                  </div>
                  
                  <h3 className="font-semibold text-gray-800 text-sm mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">
                      ₹{product.price}
                    </span>
                    <Button
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Order Summary Section */}
        <div className="w-80 bg-white shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Current Order</h2>
            <Badge variant="outline" className="text-sm">
              {cart.length} items
            </Badge>
          </div>

          {/* Cart Items */}
          <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No items in cart</p>
                <p className="text-sm">Add items to get started</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{index + 1}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(item.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <h4 className="font-medium text-gray-800">{item.name}</h4>
                    <p className="text-sm text-gray-600">₹{item.price}</p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-bold">₹{item.total}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <>
              <Separator className="my-4" />
              
              {/* Order Summary */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{getTotalAmount().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>₹{(getTotalAmount() * 0.18).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Payable Amount</span>
                  <span>₹{(getTotalAmount() * 1.18).toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1"
                    onClick={handleCashPayment}
                  >
                    <Banknote className="h-4 w-4" />
                    Cash
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1"
                    onClick={handleUPIPayment}
                  >
                    <Smartphone className="h-4 w-4" />
                    UPI
                  </Button>
                </div>
                
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-semibold"
                  onClick={handleCardPayment}
                >
                  Proceed
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <CashPaymentModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
        totalAmount={getTotalAmount()}
        onPaymentComplete={handlePaymentComplete}
        cartItems={cart}
        storeInfo={storeInfo}
      />

      <SplitPaymentModal
        isOpen={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        totalAmount={getTotalAmount()}
        cartItems={cart}
        onPaymentComplete={handlePaymentComplete}
      />

      <CreditPaymentModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        totalAmount={getTotalAmount()}
        cartItems={cart}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
};

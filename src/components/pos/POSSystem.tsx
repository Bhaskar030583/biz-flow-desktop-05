import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, ShoppingCart, Trash2, Calculator, Search, CreditCard, Banknote, SplitSquareHorizontal, User, History, Clock, Smartphone, Menu, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CashPaymentModal } from "./CashPaymentModal";
import { CreditPaymentModal } from "./CreditPaymentModal";
import { SplitPaymentModal } from "./SplitPaymentModal";
import { BillHistory } from "./BillHistory";
import { CustomerManagement } from "./CustomerManagement";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BillingModal } from "./BillingModal";
import { QuickStockUpdateModal } from "./QuickStockUpdateModal";
import { useNavigate } from "react-router-dom";
import { adjustStockForBill } from "@/services/stockService";
import { generateBill } from "@/services/billService";
import { POSMobileView } from "./POSMobileView";
import { PendingPaymentModal } from "./PendingPaymentModal";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity?: number;
}

interface CartItem extends Product {
  quantity: number;
  total: number;
}

interface StoreInfo {
  storeName: string;
  salespersonName: string;
  shiftName: string;
}

interface POSSystemProps {
  products: Product[];
  storeInfo: StoreInfo | null;
  selectedShopId: string;
  selectedShiftId?: string;
  onStockUpdated?: () => void;
}

export const POSSystem: React.FC<POSSystemProps> = ({ 
  products, 
  storeInfo, 
  selectedShopId, 
  selectedShiftId,
  onStockUpdated 
}) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCashModal, setShowCashModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showBillHistory, setShowBillHistory] = useState(false);
  const [showCustomerManagement, setShowCustomerManagement] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showQuickStockModal, setShowQuickStockModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);

  console.log('POSSystem props:', { 
    productsCount: products?.length, 
    storeInfo, 
    selectedShopId,
    selectedShiftId
  });

  const addToCart = (product: Product) => {
    // Check if product has sufficient stock
    if (product.quantity !== undefined && product.quantity <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        // Check if adding one more would exceed available stock
        if (product.quantity !== undefined && existingItem.quantity >= product.quantity) {
          toast.error(`Only ${product.quantity} units of ${product.name} available`);
          return prevCart;
        }
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1, total: product.price }];
      }
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    // Check stock availability
    const product = products?.find(p => p.id === productId);
    if (product?.quantity !== undefined && newQuantity > product.quantity) {
      toast.error(`Only ${product.quantity} units available`);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    const item = cart.find(item => item.id === productId);
    if (item) {
      toast.success(`${item.name} removed from cart`);
    }
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    toast.success("Cart cleared");
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const generateBillNumber = async (): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('generate_bill_number');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating bill number:', error);
      // Fallback to manual generation
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      const timeStr = today.getTime().toString().slice(-4);
      return `BILL-${dateStr}-${timeStr}`;
    }
  };

  const createBill = async (paymentMethod: string, paymentStatus: string = 'completed', customerId?: string, customerName?: string) => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return null;
    }

    if (!selectedShopId) {
      toast.error("No store selected");
      return null;
    }

    try {
      // First, check if we have sufficient stock for all items
      for (const item of cart) {
        const product = products?.find(p => p.id === item.id);
        if (product?.quantity !== undefined && item.quantity > product.quantity) {
          toast.error(`Insufficient stock for ${item.name}. Available: ${product.quantity}, Required: ${item.quantity}`);
          return null;
        }
      }

      // Create the bill using the service
      const billData = await generateBill({
        customerId,
        customerName,
        totalAmount: getTotalAmount(),
        paymentMethod: paymentMethod as any,
        cartItems: cart,
        storeName: storeInfo?.storeName,
        salespersonName: storeInfo?.salespersonName
      });

      // Update stock levels - decrease for sale
      try {
        await adjustStockForBill(cart, selectedShopId, user?.id || '', 'sale');
        
        // Refresh products data to show updated stock
        if (onStockUpdated) {
          onStockUpdated();
        }
      } catch (stockError) {
        console.error('Stock update failed:', stockError);
        toast.error("Bill created but stock update failed. Please check stock manually.");
      }

      return billData;
    } catch (error) {
      console.error('Error creating bill:', error);
      toast.error("Failed to create bill");
      return null;
    }
  };

  const handlePaymentComplete = () => {
    toast.success("Payment completed successfully!");
    clearCart();
    setShowCashModal(false);
    setShowCreditModal(false);
    setShowSplitModal(false);
    setShowBillingModal(false);
    setShowPendingModal(false);
  };

  const handleCashPayment = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setShowCashModal(true);
  };

  const handleUPIPayment = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    
    try {
      const bill = await createBill('upi', 'completed');
      if (bill) {
        toast.success("UPI Payment completed successfully!");
        clearCart();
      }
    } catch (error) {
      console.error('Error processing UPI payment:', error);
      toast.error("Failed to process UPI payment");
    }
  };

  const handleCreditPayment = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setShowCreditModal(true);
  };

  const handleSplitPayment = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setShowSplitModal(true);
  };

  const handlePendingPayment = async (customerName?: string) => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    
    if (customerName) {
      // Direct pending payment with customer name
      try {
        const bill = await createBill('pending', 'pending', undefined, customerName);
        if (bill) {
          toast.success(`Pending payment saved for ${customerName}`);
          clearCart();
          setShowBillingModal(false);
          setShowPendingModal(false);
        }
      } catch (error) {
        console.error('Error creating pending payment:', error);
        toast.error("Failed to create pending payment");
      }
    } else {
      // Show modal for customer name input
      setShowPendingModal(true);
    }
  };

  const handleQuickStock = () => {
    // Open quick stock update modal instead of navigating
    setShowQuickStockModal(true);
  };

  const handleStockUpdated = () => {
    // Call the parent callback to refresh products data
    if (onStockUpdated) {
      onStockUpdated();
    }
    toast.success("Stock updated successfully");
  };

  // Filter products based on search term and category
  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(products?.map(p => p.category) || []))];

  if (showBillHistory) {
    return <BillHistory />;
  }

  if (showCustomerManagement) {
    return <CustomerManagement />;
  }

  // Mobile View
  if (isMobile) {
    return (
      <>
        <POSMobileView
          products={products || []}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          addToCart={addToCart}
          filteredProducts={filteredProducts}
          storeInfo={storeInfo}
          handleQuickStock={handleQuickStock}
          setShowCustomerManagement={setShowCustomerManagement}
          setShowBillHistory={setShowBillHistory}
        />

        {/* Enhanced Mobile Floating Cart Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            onClick={() => setShowBillingModal(true)}
            className="relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-2xl rounded-full w-16 h-16 sm:w-18 sm:h-18 p-0 border-4 border-white transition-all duration-300 hover:scale-110"
          >
            <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7" />
            {cart.length > 0 && (
              <Badge className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-red-500 text-white text-xs sm:text-sm min-w-[24px] sm:min-w-[32px] h-6 sm:h-8 flex items-center justify-center rounded-full px-2 sm:px-3 font-bold shadow-lg animate-pulse">
                {cart.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Mobile Modals */}
        <BillingModal
          isOpen={showBillingModal}
          onClose={() => setShowBillingModal(false)}
          cart={cart}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          clearCart={clearCart}
          getTotalAmount={getTotalAmount}
          handleCashPayment={handleCashPayment}
          handleUPIPayment={handleUPIPayment}
          handleCreditPayment={handleCreditPayment}
          handleSplitPayment={handleSplitPayment}
          handlePendingPayment={handlePendingPayment}
        />

        <PendingPaymentModal
          isOpen={showPendingModal}
          onClose={() => setShowPendingModal(false)}
          totalAmount={getTotalAmount()}
          cartItems={cart}
          onPaymentComplete={handlePaymentComplete}
        />

        <QuickStockUpdateModal
          isOpen={showQuickStockModal}
          onClose={() => setShowQuickStockModal(false)}
          products={products || []}
          selectedShopId={selectedShopId}
          onStockUpdated={handleStockUpdated}
        />

        <CashPaymentModal
          isOpen={showCashModal}
          onClose={() => setShowCashModal(false)}
          totalAmount={getTotalAmount()}
          cartItems={cart}
          onPaymentComplete={handlePaymentComplete}
          storeInfo={storeInfo}
        />

        <CreditPaymentModal
          isOpen={showCreditModal}
          onClose={() => setShowCreditModal(false)}
          totalAmount={getTotalAmount()}
          cartItems={cart}
          onPaymentComplete={handlePaymentComplete}
        />

        <SplitPaymentModal
          isOpen={showSplitModal}
          onClose={() => setShowSplitModal(false)}
          totalAmount={getTotalAmount()}
          cartItems={cart}
          onPaymentComplete={handlePaymentComplete}
        />
      </>
    );
  }

  // Enhanced Desktop View with professional styling
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Professional Header */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <img 
                    src="/lovable-uploads/c1c145c9-7010-4fbf-9b2d-d46663dadb23.png" 
                    alt="Logo" 
                    className="h-7 w-7"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    ABC CAFE POS
                  </h1>
                  {storeInfo && (
                    <div className="flex items-center space-x-3 text-sm text-slate-600">
                      <span className="font-medium">{storeInfo.storeName}</span>
                      <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                      <span>{storeInfo.salespersonName}</span>
                      <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                      <span className="text-blue-600 font-medium">{storeInfo.shiftName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleQuickStock}
                className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm"
              >
                <Package className="h-4 w-4 mr-2" />
                Quick Stock
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomerManagement(true)}
                className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm"
              >
                <User className="h-4 w-4 mr-2" />
                Customers
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBillHistory(true)}
                className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm"
              >
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
            </div>
          </div>
        </div>

        {/* Professional Category Tabs */}
        <div className="bg-white/70 backdrop-blur-sm border-b border-slate-200 px-6 py-3">
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap shadow-sm ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white hover:shadow-sm"
                }`}
              >
                {category === "all" ? "All Items" : category}
              </button>
            ))}
          </div>
        </div>

        {/* Professional Search Bar */}
        <div className="bg-white/70 backdrop-blur-sm px-6 py-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white/90 backdrop-blur-sm shadow-sm"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50/50 to-blue-50/50">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-24 text-slate-500">
              <div className="w-32 h-32 mx-auto mb-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                <Search className="h-16 w-16 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-700">
                {selectedShopId 
                  ? searchTerm || selectedCategory !== "all"
                    ? "No products found"
                    : "No products available" 
                  : "Please select a store"
                }
              </h3>
              <p className="text-lg text-slate-500">
                {searchTerm || selectedCategory !== "all" 
                  ? "Try adjusting your search or category filter"
                  : "Add products to get started"
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
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
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm leading-tight mb-3 text-slate-800 line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </h4>
                    
                    {product.quantity !== undefined && (
                      <div className="mb-3">
                        <Badge 
                          variant="outline" 
                          className={`text-xs py-1 px-2 font-semibold shadow-sm ${
                            product.quantity > 10 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : product.quantity > 0 
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          Stock: {product.quantity}
                        </Badge>
                      </div>
                    )}
                    
                    <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-3 py-2 rounded-lg text-center shadow-md">
                      <p className="text-sm font-bold">
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

      {/* Professional Right Sidebar - Cart */}
      <div className="w-96 bg-white/95 backdrop-blur-sm border-l border-slate-200 flex flex-col shadow-xl">
        {/* Cart Header */}
        <div className="p-6 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Order Summary</h2>
            {cart.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-50/50 to-white/50">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <div className="w-20 h-20 mx-auto mb-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                <ShoppingCart className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-700">Your cart is empty</h3>
              <p className="text-base text-slate-500">Add products to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div key={item.id} className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 pr-4">
                      <h4 className="font-semibold text-sm text-slate-800">{item.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">₹{Number(item.price).toFixed(2)} each</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 w-9 p-0 border-slate-200 hover:border-blue-400 hover:bg-blue-50"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-bold text-lg min-w-[40px] text-center bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 text-slate-800">
                        {item.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 w-9 p-0 border-slate-200 hover:border-blue-400 hover:bg-blue-50"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-lg text-slate-800">₹{Number(item.total).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        {cart.length > 0 && (
          <div className="border-t border-slate-200 p-6 space-y-6 bg-white/95 backdrop-blur-sm">
            <div className="space-y-3">
              <div className="flex justify-between text-base font-medium text-slate-700">
                <span>Subtotal</span>
                <span>₹{getTotalAmount().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-medium text-slate-700">
                <span>Tax</span>
                <span>₹0.00</span>
              </div>
              <Separator className="my-3 bg-slate-200" />
              <div className="flex justify-between text-2xl font-bold text-slate-800">
                <span>Total</span>
                <span className="text-blue-600">₹{getTotalAmount().toFixed(2)}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 h-14 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                onClick={handleCashPayment}
              >
                <Banknote className="h-5 w-5 mr-3" />
                Cash Payment
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline"
                  className="h-12 font-semibold bg-white hover:bg-green-50 border-slate-200 text-slate-700 hover:border-green-300 hover:text-green-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300" 
                  onClick={handleUPIPayment}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  UPI
                </Button>
                <Button 
                  variant="outline"
                  className="h-12 font-semibold bg-white hover:bg-purple-50 border-slate-200 text-slate-700 hover:border-purple-300 hover:text-purple-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300" 
                  onClick={handleCreditPayment}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Credit
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline"
                  className="h-12 font-semibold bg-white hover:bg-amber-50 border-slate-200 text-slate-700 hover:border-amber-300 hover:text-amber-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300" 
                  onClick={handleSplitPayment}
                >
                  <SplitSquareHorizontal className="h-4 w-4 mr-2" />
                  Split Payment
                </Button>
                <Button 
                  variant="outline"
                  className="h-12 font-semibold bg-white hover:bg-orange-50 border-slate-200 text-slate-700 hover:border-orange-300 hover:text-orange-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300" 
                  onClick={() => handlePendingPayment()}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Pending
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

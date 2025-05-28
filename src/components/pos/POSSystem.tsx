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
import { POSMobileView } from "./POSMobileView";

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
    toast.success(`${product.name} added to cart`);
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

  const createBill = async (paymentMethod: string, paymentStatus: string = 'completed', customerId?: string) => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return null;
    }

    if (!selectedShopId) {
      toast.error("No store selected");
      return null;
    }

    try {
      const billNumber = await generateBillNumber();
      const totalAmount = getTotalAmount();

      // First, check if we have sufficient stock for all items
      for (const item of cart) {
        const product = products?.find(p => p.id === item.id);
        if (product?.quantity !== undefined && item.quantity > product.quantity) {
          toast.error(`Insufficient stock for ${item.name}. Available: ${product.quantity}, Required: ${item.quantity}`);
          return null;
        }
      }

      // Create the bill
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .insert({
          bill_number: billNumber,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          customer_id: customerId || null,
          user_id: user?.id,
          bill_date: new Date().toISOString()
        })
        .select()
        .single();

      if (billError) throw billError;

      // Create bill items
      const billItems = cart.map(item => ({
        bill_id: billData.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.total
      }));

      const { error: itemsError } = await supabase
        .from('bill_items')
        .insert(billItems);

      if (itemsError) throw itemsError;

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

  const handlePendingPayment = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    
    try {
      const bill = await createBill('pending', 'pending');
      if (bill) {
        toast.success("Bill saved as pending payment");
        clearCart();
      }
    } catch (error) {
      console.error('Error creating pending payment:', error);
      toast.error("Failed to create pending payment");
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

        {/* Mobile Floating Cart Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            onClick={() => setShowBillingModal(true)}
            className="relative bg-orange-500 hover:bg-orange-600 text-white shadow-2xl rounded-full w-16 h-16 p-0"
          >
            <ShoppingCart className="h-6 w-6" />
            {cart.length > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-sm min-w-[28px] h-7 flex items-center justify-center rounded-full px-2 font-bold">
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

  // Desktop View - matching the reference design
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Categories */}
      <div className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-4">
        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
          <img 
            src="/lovable-uploads/c1c145c9-7010-4fbf-9b2d-d46663dadb23.png" 
            alt="Logo" 
            className="h-8 w-8"
          />
        </div>
        
        {/* Category Icons */}
        {categories.slice(0, 6).map((category, index) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              selectedCategory === category
                ? "bg-orange-100 text-orange-600 border-2 border-orange-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title={category === "all" ? "All Items" : category}
          >
            <Package className="h-5 w-5" />
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Products Section */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ABC CAFE</h1>
                {storeInfo && (
                  <p className="text-sm text-gray-600">
                    {storeInfo.storeName} • {storeInfo.salespersonName}
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQuickStock}
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Quick Stock
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomerManagement(true)}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Customers
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBillHistory(true)}
                  className="flex items-center gap-2"
                >
                  <History className="h-4 w-4" />
                  History
                </Button>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex space-x-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedCategory === category
                      ? "bg-orange-500 text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {category === "all" ? "All" : category}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-700">
                  {selectedShopId 
                    ? searchTerm || selectedCategory !== "all"
                      ? "No products found"
                      : "No products available" 
                    : "Please select a store"
                  }
                </h3>
                <p className="text-base text-gray-400">
                  {searchTerm || selectedCategory !== "all" 
                    ? "Try adjusting your search or category filter"
                    : "Add products to get started"
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    className={`cursor-pointer transition-all duration-200 border-2 hover:shadow-lg group ${
                      product.quantity !== undefined && product.quantity <= 0 
                        ? 'border-red-200 bg-red-50 opacity-75' 
                        : 'border-gray-200 bg-white hover:border-orange-300'
                    }`}
                    onClick={() => addToCart(product)}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                      
                      <h4 className="font-semibold text-sm mb-2 text-gray-800 line-clamp-2 min-h-[2.5rem] leading-tight">
                        {product.name}
                      </h4>
                      
                      {product.quantity !== undefined && (
                        <div className="mb-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs py-1 px-2 font-medium ${
                              product.quantity > 10 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : product.quantity > 0 
                                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            Stock: {product.quantity}
                          </Badge>
                        </div>
                      )}
                      
                      <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-center">
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

        {/* Right Sidebar - Cart */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          {/* Cart Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Current Order</h2>
              {cart.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-700">Your cart is empty</h3>
                <p className="text-sm text-gray-400">Add products to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item, index) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 pr-3">
                        <h4 className="font-semibold text-sm text-gray-800">{item.name}</h4>
                        <p className="text-xs text-gray-600">₹{Number(item.price).toFixed(2)} each</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-bold text-sm min-w-[32px] text-center bg-white px-3 py-1 rounded border">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-bold text-gray-900">₹{Number(item.total).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="border-t border-gray-200 p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{getTotalAmount().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>₹0.00</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Payable Amount</span>
                  <span>₹{getTotalAmount().toFixed(2)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 h-12" 
                  onClick={handleCashPayment}
                >
                  <Banknote className="h-4 w-4 mr-2" />
                  Cash Payment
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline"
                    className="h-10" 
                    onClick={handleUPIPayment}
                  >
                    <Smartphone className="h-4 w-4 mr-1" />
                    UPI
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-10" 
                    onClick={handleCreditPayment}
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    Credit
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Modals */}
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
    </div>
  );
};

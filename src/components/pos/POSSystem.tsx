
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, ShoppingCart, Trash2, Calculator, Search, CreditCard, Banknote, SplitSquareHorizontal, User, History, Clock, Smartphone, Menu } from "lucide-react";
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
}

interface POSSystemProps {
  products: Product[];
  storeInfo: StoreInfo | null;
  selectedShopId: string;
}

export const POSSystem: React.FC<POSSystemProps> = ({ products, storeInfo, selectedShopId }) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
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

  console.log('POSSystem props:', { 
    productsCount: products?.length, 
    storeInfo, 
    selectedShopId 
  });

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
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

  // Mobile Categories Sidebar
  const CategoriesList = () => (
    <div className="space-y-1 p-2">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => {
            setSelectedCategory(category);
            setShowCategories(false);
          }}
          className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
            selectedCategory === category
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
              : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
          }`}
        >
          {category === "all" ? "All Items" : category}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-blue-100">
        <div className="w-full px-3 md:px-6 py-2 md:py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="bg-gradient-to-r from-orange-600 to-red-700 p-2 md:p-4 rounded-xl shadow-lg">
                <img 
                  src="/lovable-uploads/c1c145c9-7010-4fbf-9b2d-d46663dadb23.png" 
                  alt="ABC Cafe Logo" 
                  className="h-5 w-5 md:h-8 md:w-8"
                />
              </div>
              <div>
                <h1 className="text-lg md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-700 bg-clip-text text-transparent">
                  ABC CAFE
                </h1>
                {storeInfo && (
                  <p className="text-xs md:text-sm text-gray-600 font-medium">
                    {storeInfo.storeName} • {storeInfo.salespersonName}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-1 md:gap-3 items-center">
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                onClick={() => setShowCustomerManagement(true)}
                className="flex items-center gap-1 md:gap-2 bg-white hover:bg-blue-50 border-blue-200 text-blue-700 shadow-sm px-2 md:px-4"
              >
                <User className="h-3 w-3 md:h-4 md:w-4" />
                {!isMobile && "Customers"}
              </Button>
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                onClick={() => setShowBillHistory(true)}
                className="flex items-center gap-1 md:gap-2 bg-white hover:bg-blue-50 border-blue-200 text-blue-700 shadow-sm px-2 md:px-4"
              >
                <History className="h-3 w-3 md:h-4 md:w-4" />
                {!isMobile && "History"}
              </Button>
              {/* Cart Icon */}
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                onClick={() => setShowBillingModal(true)}
                className="flex items-center gap-1 md:gap-2 bg-white hover:bg-blue-50 border-blue-200 text-blue-700 shadow-sm px-2 md:px-4 relative"
              >
                <ShoppingCart className="h-3 w-3 md:h-4 md:w-4" />
                {!isMobile && "Cart"}
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                    {cart.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full p-2 md:p-6">
        {isMobile ? (
          // Mobile Layout - Stacked
          <div className="space-y-3">
            {/* Search Bar */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-blue-200 focus:border-blue-400 focus:ring-blue-300 h-9"
                      />
                    </div>
                    <Sheet open={showCategories} onOpenChange={setShowCategories}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="shrink-0 h-9 w-9 p-0">
                          <Menu className="h-4 w-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-64">
                        <div className="py-4">
                          <h3 className="text-lg font-semibold mb-4">Categories</h3>
                          <CategoriesList />
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Category:</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                      {selectedCategory === "all" ? "All Items" : selectedCategory}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Grid */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base text-blue-900 font-semibold">Products</CardTitle>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-medium text-xs">
                    {filteredProducts.length} items
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-3">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    {selectedShopId 
                      ? searchTerm || selectedCategory !== "all"
                        ? "No products found matching your criteria"
                        : "No products available in this store" 
                      : "Please select a store to view products"
                    }
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {filteredProducts.map((product) => (
                      <Card 
                        key={product.id} 
                        className="cursor-pointer hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-blue-50 hover:from-blue-50 hover:to-blue-100 transform hover:scale-105 active:scale-95"
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-2">
                          <div className="text-center">
                            <h4 className="font-semibold text-xs mb-1 text-gray-800 line-clamp-2 min-h-[1.75rem] leading-tight">
                              {product.name}
                            </h4>
                            
                            {/* Quantity Badge */}
                            {product.quantity !== undefined && (
                              <div className="mb-1">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs py-0 px-1 ${
                                    product.quantity > 10 
                                      ? 'bg-green-50 text-green-700 border-green-200' 
                                      : product.quantity > 0 
                                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                        : 'bg-red-50 text-red-700 border-red-200'
                                  }`}
                                >
                                  Qty: {product.quantity}
                                </Badge>
                              </div>
                            )}
                            
                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-full">
                              <p className="text-xs font-bold">
                                ₹{Number(product.price).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          // Desktop/Tablet Layout - Three Column Layout
          <div className="grid grid-cols-12 gap-4 h-[calc(100vh-160px)]">
            {/* Left - Categories Sidebar */}
            <div className="col-span-3 lg:col-span-2">
              <Card className="h-full shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <CardTitle className="text-lg text-blue-900 font-semibold">Categories</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <CategoriesList />
                </CardContent>
              </Card>
            </div>

            {/* Middle - Products Grid and Search */}
            <div className="col-span-9 lg:col-span-10">
              <Card className="h-full shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg text-blue-900 font-semibold">Products</CardTitle>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-medium">
                      {filteredProducts.length} items
                    </Badge>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-blue-200 focus:border-blue-400 focus:ring-blue-300"
                    />
                  </div>
                </CardHeader>
                
                <CardContent className="h-[calc(100%-140px)] overflow-y-auto p-4">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      {selectedShopId 
                        ? searchTerm || selectedCategory !== "all"
                          ? "No products found matching your criteria"
                          : "No products available in this store" 
                        : "Please select a store to view products"
                      }
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                      {filteredProducts.map((product) => (
                        <Card 
                          key={product.id} 
                          className="cursor-pointer hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-blue-50 hover:from-blue-50 hover:to-blue-100 transform hover:scale-105"
                          onClick={() => addToCart(product)}
                        >
                          <CardContent className="p-3">
                            <div className="text-center">
                              <h4 className="font-semibold text-sm mb-2 text-gray-800 line-clamp-2 min-h-[2.5rem]">
                                {product.name}
                              </h4>
                              
                              {/* Quantity Badge */}
                              {product.quantity !== undefined && (
                                <div className="mb-2">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      product.quantity > 10 
                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                        : product.quantity > 0 
                                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                          : 'bg-red-50 text-red-700 border-red-200'
                                    }`}
                                  >
                                    Qty: {product.quantity}
                                  </Badge>
                                </div>
                              )}
                              
                              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full">
                                <p className="text-sm font-bold">
                                  ₹{Number(product.price).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Billing Modal */}
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

        {/* Payment Modals */}
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
    </div>
  );
};

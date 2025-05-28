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
          className={`w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
            selectedCategory === category
              ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105"
              : "text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm"
          }`}
        >
          {category === "all" ? "All Items" : category}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header with Professional Design */}
      <div className="bg-white shadow-xl border-b-2 border-blue-100 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="w-full px-4 md:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 md:p-3 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <img 
                  src="/lovable-uploads/c1c145c9-7010-4fbf-9b2d-d46663dadb23.png" 
                  alt="ABC Cafe Logo" 
                  className="h-6 w-6 md:h-8 md:w-8"
                />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-700 bg-clip-text text-transparent">
                  ABC CAFE
                </h1>
                {storeInfo && (
                  <div className="text-xs md:text-sm text-gray-600 font-medium">
                    <p className="hidden sm:block">
                      {storeInfo.storeName} • {storeInfo.salespersonName}
                    </p>
                    {storeInfo.shiftName && (
                      <p className="text-xs text-blue-600 font-semibold">
                        Shift: {storeInfo.shiftName}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 md:gap-3 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleQuickStock}
                className="flex items-center gap-1 md:gap-2 bg-white hover:bg-green-50 border-green-200 text-green-700 shadow-md hover:shadow-lg transition-all duration-200 px-2 md:px-4 h-8 md:h-10 rounded-lg"
              >
                <Package className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden md:inline text-xs md:text-sm font-medium">Quick Stock</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomerManagement(true)}
                className="flex items-center gap-1 md:gap-2 bg-white hover:bg-purple-50 border-purple-200 text-purple-700 shadow-md hover:shadow-lg transition-all duration-200 px-2 md:px-4 h-8 md:h-10 rounded-lg"
              >
                <User className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden md:inline text-xs md:text-sm font-medium">Customers</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBillHistory(true)}
                className="flex items-center gap-1 md:gap-2 bg-white hover:bg-blue-50 border-blue-200 text-blue-700 shadow-md hover:shadow-lg transition-all duration-200 px-2 md:px-4 h-8 md:h-10 rounded-lg"
              >
                <History className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden md:inline text-xs md:text-sm font-medium">History</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full p-3 md:p-4 lg:p-6 xl:p-8 pb-28">
        {isMobile ? (
          // Enhanced Mobile Layout
          <div className="space-y-4">
            {/* Professional Search Bar */}
            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-blue-200 focus:border-blue-400 focus:ring-blue-300 h-11 text-sm rounded-xl bg-gray-50 focus:bg-white transition-colors"
                      />
                    </div>
                    <Sheet open={showCategories} onOpenChange={setShowCategories}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="shrink-0 h-11 w-11 p-0 rounded-xl bg-white hover:bg-blue-50 border-blue-200 shadow-md">
                          <Menu className="h-4 w-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-80">
                        <div className="py-6">
                          <h3 className="text-lg font-semibold mb-4 text-gray-800">Categories</h3>
                          <CategoriesList />
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 font-medium">Category:</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium">
                      {selectedCategory === "all" ? "All Items" : selectedCategory}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Products Grid */}
            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base text-blue-900 font-semibold">Products</CardTitle>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-medium text-sm px-3 py-1 rounded-full">
                    {filteredProducts.length} items
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">
                      {selectedShopId 
                        ? searchTerm || selectedCategory !== "all"
                          ? "No products found"
                          : "No products available" 
                        : "Please select a store"
                      }
                    </h3>
                    <p className="text-sm text-gray-400">
                      {searchTerm || selectedCategory !== "all" 
                        ? "Try adjusting your search or category filter"
                        : "Add products to get started"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {filteredProducts.map((product) => (
                      <Card 
                        key={product.id} 
                        className={`cursor-pointer hover:shadow-xl transition-all duration-300 border-2 transform hover:scale-105 active:scale-95 ${
                          product.quantity !== undefined && product.quantity <= 0 
                            ? 'border-red-200 bg-gradient-to-br from-red-50 to-red-100 opacity-75' 
                            : 'border-blue-100 bg-gradient-to-br from-white to-blue-50 hover:from-blue-50 hover:to-blue-100 hover:border-blue-300'
                        }`}
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-3">
                          <div className="text-center space-y-3">
                            <h4 className="font-semibold text-sm mb-2 text-gray-800 line-clamp-2 min-h-[2.5rem] leading-tight">
                              {product.name}
                            </h4>
                            
                            {/* Enhanced Stock Badge */}
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
                            
                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-xl shadow-md hover:shadow-lg transition-shadow">
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
        ) : (
          // Enhanced Desktop/Tablet Layout
          <div className="grid grid-cols-12 gap-4 md:gap-6 lg:gap-8 h-[calc(100vh-140px)] lg:h-[calc(100vh-160px)]">
            {/* Enhanced Categories Sidebar */}
            <div className="col-span-3 lg:col-span-2">
              <Card className="h-full shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                  <CardTitle className="text-sm md:text-base lg:text-lg text-blue-900 font-semibold">Categories</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-2 p-3 md:p-4">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full text-left px-3 md:px-4 py-3 md:py-4 text-sm md:text-base font-medium rounded-xl transition-all duration-300 ${
                          selectedCategory === category
                            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105"
                            : "text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md"
                        }`}
                      >
                        {category === "all" ? "All Items" : category}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Products Section */}
            <div className="col-span-9 lg:col-span-10">
              <Card className="h-full shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                  <div className="flex justify-between items-center mb-4">
                    <CardTitle className="text-base md:text-lg lg:text-xl text-blue-900 font-semibold">Products</CardTitle>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-medium text-sm md:text-base px-4 py-2 rounded-full">
                      {filteredProducts.length} items
                    </Badge>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-4 md:left-5 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 md:h-5 md:w-5" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 md:pl-14 border-blue-200 focus:border-blue-400 focus:ring-blue-300 h-11 md:h-12 text-sm md:text-base rounded-xl bg-gray-50 focus:bg-white transition-colors"
                    />
                  </div>
                </CardHeader>
                
                <CardContent className="h-[calc(100%-160px)] md:h-[calc(100%-180px)] lg:h-[calc(100%-200px)] overflow-y-auto p-4 md:p-6">
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
                      {filteredProducts.map((product) => (
                        <Card 
                          key={product.id} 
                          className={`cursor-pointer hover:shadow-xl transition-all duration-300 border-2 transform hover:scale-105 group ${
                            product.quantity !== undefined && product.quantity <= 0 
                              ? 'border-red-200 bg-gradient-to-br from-red-50 to-red-100 opacity-75' 
                              : 'border-blue-100 bg-gradient-to-br from-white to-blue-50 hover:from-blue-50 hover:to-blue-100 hover:border-blue-300'
                          }`}
                          onClick={() => addToCart(product)}
                        >
                          <CardContent className="p-4 md:p-5">
                            <div className="text-center space-y-3">
                              <h4 className="font-semibold text-sm md:text-base mb-2 text-gray-800 line-clamp-2 min-h-[2.5rem] md:min-h-[3rem] leading-tight group-hover:text-blue-700 transition-colors">
                                {product.name}
                              </h4>
                              
                              {/* Enhanced Stock Badge */}
                              {product.quantity !== undefined && (
                                <div className="mb-3">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs md:text-sm py-1 px-3 font-medium ${
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
                              
                              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 md:px-5 py-3 md:py-4 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
                                <p className="text-sm md:text-base font-bold">
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

        {/* Enhanced Floating Cart Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            onClick={() => setShowBillingModal(true)}
            className="relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 rounded-full w-16 h-16 md:w-18 md:h-18 p-0 group"
          >
            <ShoppingCart className="h-6 w-6 md:h-7 md:w-7 group-hover:scale-110 transition-transform" />
            {cart.length > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-sm min-w-[28px] h-7 flex items-center justify-center rounded-full px-2 font-bold shadow-lg border-2 border-white">
                {cart.length}
              </Badge>
            )}
          </Button>
          
          {/* Enhanced Cart Preview */}
          {cart.length > 0 && (
            <div className="absolute bottom-20 right-0 w-80 max-w-[calc(100vw-3rem)] bg-white rounded-xl shadow-2xl border border-gray-200 p-5 transform transition-all duration-300 hover:scale-105">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">Cart Preview</h3>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-medium">
                  {cart.length} items
                </Badge>
              </div>
              
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {cart.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm bg-gray-50 rounded-lg p-3">
                    <div className="flex-1 pr-2">
                      <p className="font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="text-gray-600">₹{Number(item.price).toFixed(2)} × {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-green-600">₹{Number(item.total).toFixed(2)}</p>
                  </div>
                ))}
                {cart.length > 5 && (
                  <div className="text-center text-sm text-gray-500 py-2 font-medium">
                    +{cart.length - 5} more items
                  </div>
                )}
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-gray-800">Total:</span>
                <span className="text-green-600">₹{getTotalAmount().toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

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

        {/* Quick Stock Update Modal */}
        <QuickStockUpdateModal
          isOpen={showQuickStockModal}
          onClose={() => setShowQuickStockModal(false)}
          products={products || []}
          selectedShopId={selectedShopId}
          onStockUpdated={handleStockUpdated}
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

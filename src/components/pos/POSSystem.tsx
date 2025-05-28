import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, ShoppingCart, Trash2, Calculator, Search, CreditCard, Banknote, SplitSquareHorizontal, User, History, Clock, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CashPaymentModal } from "./CashPaymentModal";
import { CreditPaymentModal } from "./CreditPaymentModal";
import { SplitPaymentModal } from "./SplitPaymentModal";
import { BillHistory } from "./BillHistory";
import { CustomerManagement } from "./CustomerManagement";
import { useAuth } from "@/context/AuthContext";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCashModal, setShowCashModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showBillHistory, setShowBillHistory] = useState(false);
  const [showCustomerManagement, setShowCustomerManagement] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-xl shadow-lg">
                <ShoppingCart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Point of Sale
                </h1>
                {storeInfo && (
                  <p className="text-sm text-gray-600 font-medium">
                    {storeInfo.storeName} • {storeInfo.salespersonName}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCustomerManagement(true)}
                className="flex items-center gap-2 bg-white hover:bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
              >
                <User className="h-4 w-4" />
                Customers
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBillHistory(true)}
                className="flex items-center gap-2 bg-white hover:bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
              >
                <History className="h-4 w-4" />
                History
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-160px)]">
          {/* Categories Sidebar */}
          <div className="col-span-2">
            <Card className="h-full shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <CardTitle className="text-lg text-blue-900 font-semibold">Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1 p-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        selectedCategory === category
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105"
                          : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                      }`}
                    >
                      {category === "all" ? "All Items" : category}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="col-span-7">
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
                  <div className="grid grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                      <Card 
                        key={product.id} 
                        className="cursor-pointer hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-blue-50 hover:from-blue-50 hover:to-blue-100 transform hover:scale-105"
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-4">
                          <div className="text-center">
                            <h4 className="font-semibold text-sm mb-3 text-gray-800 line-clamp-2 min-h-[2.5rem]">
                              {product.name}
                            </h4>
                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full">
                              <p className="text-lg font-bold">
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

          {/* Cart and Payment */}
          <div className="col-span-3">
            <Card className="h-full shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2 text-blue-900 font-semibold">
                    <Calculator className="h-5 w-5" />
                    Cart ({cart.length})
                  </span>
                  {cart.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearCart}
                      className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="h-[calc(100%-80px)] flex flex-col p-4">
                {cart.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium">Cart is empty</p>
                      <p className="text-sm">Add products to get started</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Cart Items */}
                    <div className="flex-1 space-y-3 overflow-y-auto mb-4">
                      {cart.map((item) => (
                        <div key={item.id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 shadow-sm border border-blue-100">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm text-gray-800">{item.name}</h4>
                              <p className="text-xs text-gray-600">₹{Number(item.price).toFixed(2)} each</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 h-auto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 border-blue-200 hover:bg-blue-50"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="font-semibold text-sm min-w-[30px] text-center bg-white px-2 py-1 rounded">
                                {item.quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 border-blue-200 hover:bg-blue-50"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="font-bold text-green-700 text-sm bg-green-100 px-2 py-1 rounded">
                              ₹{Number(item.total).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    {/* Total */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-4 border border-green-200">
                      <div className="flex justify-between items-center text-xl font-bold">
                        <span className="text-gray-800">Total:</span>
                        <span className="text-green-700">₹{getTotalAmount().toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Payment Buttons - Made Smaller */}
                    <div className="space-y-1.5">
                      <Button 
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 shadow-md transform hover:scale-105 transition-all duration-200 text-sm" 
                        onClick={handleCashPayment}
                        disabled={cart.length === 0}
                      >
                        <Banknote className="h-4 w-4 mr-2" />
                        Cash
                      </Button>
                      
                      <Button 
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 shadow-md transform hover:scale-105 transition-all duration-200 text-sm" 
                        onClick={handleUPIPayment}
                        disabled={cart.length === 0}
                      >
                        <Smartphone className="h-4 w-4 mr-2" />
                        UPI
                      </Button>
                      
                      <Button 
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 shadow-md transform hover:scale-105 transition-all duration-200 text-sm" 
                        onClick={handleCreditPayment}
                        disabled={cart.length === 0}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Credit
                      </Button>
                      
                      <Button 
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 shadow-md transform hover:scale-105 transition-all duration-200 text-sm" 
                        onClick={handleSplitPayment}
                        disabled={cart.length === 0}
                      >
                        <SplitSquareHorizontal className="h-4 w-4 mr-2" />
                        Split
                      </Button>
                      
                      <Button 
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 shadow-md transform hover:scale-105 transition-all duration-200 text-sm" 
                        onClick={handlePendingPayment}
                        disabled={cart.length === 0}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Pending
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

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

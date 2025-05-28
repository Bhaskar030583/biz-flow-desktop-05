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

  const handlePendingPayment = async () => {
    const bill = await createBill('pending', 'pending');
    if (bill) {
      toast.success("Bill saved as pending payment");
      clearCart();
    }
  };

  const handleUPIPayment = () => {
    // For now, treat UPI as credit payment
    setShowCreditModal(true);
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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-lg">
                <ShoppingCart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
                {storeInfo && (
                  <p className="text-sm text-gray-600">
                    {storeInfo.storeName} • {storeInfo.salespersonName}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCustomerManagement(true)}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Customers
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBillHistory(true)}
                className="flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                History
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
          {/* Categories Sidebar */}
          <div className="col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                        selectedCategory === category
                          ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                          : "text-gray-700 hover:bg-gray-50"
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
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Products</CardTitle>
                  <Badge variant="secondary">
                    {filteredProducts.length} items
                  </Badge>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              
              <CardContent className="h-[calc(100%-120px)] overflow-y-auto">
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
                  <div className="grid grid-cols-3 gap-3">
                    {filteredProducts.map((product) => (
                      <Card 
                        key={product.id} 
                        className="cursor-pointer hover:shadow-md transition-all duration-200 border-gray-200"
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-4">
                          <div className="text-center">
                            <h4 className="font-semibold text-sm mb-2 text-gray-800 line-clamp-2">
                              {product.name}
                            </h4>
                            <p className="text-xl font-bold text-green-600">
                              ₹{Number(product.price).toFixed(2)}
                            </p>
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
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Cart ({cart.length})
                  </span>
                  {cart.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearCart}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="h-[calc(100%-80px)] flex flex-col">
                {cart.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Cart is empty</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Cart Items */}
                    <div className="flex-1 space-y-3 overflow-y-auto mb-4">
                      {cart.map((item) => (
                        <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm text-gray-800">{item.name}</h4>
                              <p className="text-xs text-gray-600">₹{Number(item.price).toFixed(2)} each</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-700 p-1 h-auto"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="font-medium text-sm min-w-[20px] text-center">
                                {item.quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="font-bold text-green-600 text-sm">₹{Number(item.total).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    {/* Total */}
                    <div className="bg-green-50 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center text-xl font-bold">
                        <span className="text-gray-800">Total:</span>
                        <span className="text-green-600">₹{getTotalAmount().toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Payment Buttons */}
                    <div className="space-y-2">
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white" 
                        onClick={() => setShowCashModal(true)}
                        disabled={cart.length === 0}
                      >
                        <Banknote className="h-4 w-4 mr-2" />
                        Cash
                      </Button>
                      
                      <Button 
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white" 
                        onClick={handleUPIPayment}
                        disabled={cart.length === 0}
                      >
                        <Smartphone className="h-4 w-4 mr-2" />
                        UPI
                      </Button>
                      
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                        onClick={() => setShowCreditModal(true)}
                        disabled={cart.length === 0}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Credit
                      </Button>
                      
                      <Button 
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white" 
                        onClick={() => setShowSplitModal(true)}
                        disabled={cart.length === 0}
                      >
                        <SplitSquareHorizontal className="h-4 w-4 mr-2" />
                        Split
                      </Button>
                      
                      <Button 
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white" 
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


import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, ShoppingCart, Trash2, Calculator, Receipt, Search, CreditCard, Banknote, SplitSquareHorizontal, User, History } from "lucide-react";
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

  // Filter products based on search term
  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Group products by category
  const productsByCategory = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  if (showBillHistory) {
    return <BillHistory />;
  }

  if (showCustomerManagement) {
    return <CustomerManagement />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Point of Sale</h1>
              {storeInfo && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{storeInfo.storeName}</span> • 
                  <span className="ml-1">Operator: {storeInfo.salespersonName}</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCustomerManagement(true)}
                className="flex items-center gap-2 bg-white hover:bg-gray-50"
              >
                <User className="h-4 w-4" />
                Customers
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBillHistory(true)}
                className="flex items-center gap-2 bg-white hover:bg-gray-50"
              >
                <History className="h-4 w-4" />
                History
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                    Products
                    {selectedShopId && (
                      <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                        {filteredProducts.length} available
                      </Badge>
                    )}
                  </CardTitle>
                </div>
                
                {/* Enhanced Search */}
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search products by name or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </CardHeader>
              
              <CardContent className="max-h-[600px] overflow-y-auto">
                {Object.keys(productsByCategory).length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold mb-2 text-gray-600">No Products Available</h3>
                    <p className="text-gray-500">
                      {selectedShopId 
                        ? searchTerm 
                          ? `No products found matching "${searchTerm}"`
                          : "No products are assigned to this store yet." 
                        : "Please select a store to view available products."
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
                      <div key={category}>
                        <div className="flex items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-800 bg-gray-100 px-3 py-1 rounded-full">
                            {category}
                          </h3>
                          <div className="flex-1 ml-3 border-t border-gray-200"></div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {categoryProducts.map((product) => (
                            <Card 
                              key={product.id} 
                              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-blue-300 hover:scale-105 bg-gradient-to-br from-white to-blue-50"
                              onClick={() => addToCart(product)}
                            >
                              <CardContent className="p-4">
                                <div className="text-center">
                                  <h4 className="font-semibold text-sm mb-2 text-gray-800 line-clamp-2 min-h-[2.5rem]">
                                    {product.name}
                                  </h4>
                                  <div className="bg-green-100 rounded-lg p-2">
                                    <p className="text-xl font-bold text-green-700">
                                      ₹{Number(product.price).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cart Section */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xl">
                    <Calculator className="h-5 w-5 text-purple-600" />
                    Cart ({cart.length})
                  </span>
                  {cart.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearCart}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">Cart is empty</p>
                    <p className="text-sm mt-2">Add products to get started</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm text-gray-800">{item.name}</h4>
                              <p className="text-sm text-gray-600">₹{Number(item.price).toFixed(2)} each</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 hover:bg-blue-50"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="font-bold min-w-[3rem] text-center bg-white px-2 py-1 rounded border">
                                {item.quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 hover:bg-blue-50"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-green-700">₹{Number(item.total).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    {/* Total Section */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <div className="flex justify-between items-center text-2xl font-bold">
                        <span className="text-gray-800">Total:</span>
                        <span className="text-green-700">₹{getTotalAmount().toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Payment Buttons */}
                    <div className="space-y-3 pt-4">
                      <Button 
                        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg" 
                        onClick={() => setShowCashModal(true)}
                        disabled={cart.length === 0}
                      >
                        <Banknote className="h-5 w-5 mr-2" />
                        Cash Payment
                      </Button>
                      <Button 
                        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg" 
                        onClick={() => setShowCreditModal(true)}
                        disabled={cart.length === 0}
                      >
                        <CreditCard className="h-5 w-5 mr-2" />
                        Credit Payment
                      </Button>
                      <Button 
                        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg" 
                        onClick={() => setShowSplitModal(true)}
                        disabled={cart.length === 0}
                      >
                        <SplitSquareHorizontal className="h-5 w-5 mr-2" />
                        Split Payment
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

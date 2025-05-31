
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { BillingModal } from "./BillingModal";
import { BillHistory } from "./BillHistory";
import { CustomerManagement } from "./CustomerManagement";
import { POSMobileView } from "./POSMobileView";
import { POSHeader } from "./POSHeader";
import { POSProductGrid } from "./POSProductGrid";
import { POSCartSidebar } from "./POSCartSidebar";
import { POSModals } from "./POSModals";
import { createPaymentActions } from "./POSPaymentActions";

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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCashModal, setShowCashModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showBillHistory, setShowBillHistory] = useState(false);
  const [showCustomerManagement, setShowCustomerManagement] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showQuickStockModal, setShowQuickStockModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(true);

  // Create payment actions
  const paymentActions = createPaymentActions({
    cart,
    products: products || [],
    selectedShopId,
    storeInfo,
    userId: user?.id || '',
    onStockUpdated
  });

  const addToCart = (product: Product) => {
    if (product.quantity !== undefined && product.quantity <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
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

  const handlePendingPayment = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setShowPendingModal(true);
  };

  const handleQuickStock = () => {
    setShowQuickStockModal(true);
  };

  const handleStockUpdated = () => {
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

        <BillingModal
          isOpen={showBillingModal}
          onClose={() => setShowBillingModal(false)}
          cart={cart}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          clearCart={clearCart}
          getTotalAmount={getTotalAmount}
          handleCashPayment={handleCashPayment}
          handleUPIPayment={paymentActions.handleUPIPayment}
          handleCreditPayment={handleCreditPayment}
          handleSplitPayment={handleSplitPayment}
          handlePendingPayment={handlePendingPayment}
        />

        <POSModals
          showCashModal={showCashModal}
          showCreditModal={showCreditModal}
          showSplitModal={showSplitModal}
          showPendingModal={showPendingModal}
          showQuickStockModal={showQuickStockModal}
          cart={cart}
          products={products || []}
          totalAmount={getTotalAmount()}
          storeInfo={storeInfo}
          selectedShopId={selectedShopId}
          onCloseCash={() => setShowCashModal(false)}
          onCloseCredit={() => setShowCreditModal(false)}
          onCloseSplit={() => setShowSplitModal(false)}
          onClosePending={() => setShowPendingModal(false)}
          onCloseQuickStock={() => setShowQuickStockModal(false)}
          onPaymentComplete={handlePaymentComplete}
          onStockUpdated={handleStockUpdated}
        />
      </>
    );
  }

  // Desktop View
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 overflow-hidden font-inter">
      <div className="flex-1 flex flex-col min-w-0">
        <POSHeader
          storeInfo={storeInfo}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showOrderSummary={showOrderSummary}
          setShowOrderSummary={setShowOrderSummary}
          onQuickStock={handleQuickStock}
          onCustomerManagement={() => setShowCustomerManagement(true)}
          onBillHistory={() => setShowBillHistory(true)}
        />

        <POSProductGrid
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          filteredProducts={filteredProducts}
          selectedShopId={selectedShopId}
          onAddToCart={addToCart}
        />
      </div>

      {showOrderSummary && (
        <POSCartSidebar
          cart={cart}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          clearCart={clearCart}
          getTotalAmount={getTotalAmount}
          onCashPayment={handleCashPayment}
          onUPIPayment={paymentActions.handleUPIPayment}
          onCreditPayment={handleCreditPayment}
          onSplitPayment={handleSplitPayment}
          onPendingPayment={handlePendingPayment}
        />
      )}

      <POSModals
        showCashModal={showCashModal}
        showCreditModal={showCreditModal}
        showSplitModal={showSplitModal}
        showPendingModal={showPendingModal}
        showQuickStockModal={showQuickStockModal}
        cart={cart}
        products={products || []}
        totalAmount={getTotalAmount()}
        storeInfo={storeInfo}
        selectedShopId={selectedShopId}
        onCloseCash={() => setShowCashModal(false)}
        onCloseCredit={() => setShowCreditModal(false)}
        onCloseSplit={() => setShowSplitModal(false)}
        onClosePending={() => setShowPendingModal(false)}
        onCloseQuickStock={() => setShowQuickStockModal(false)}
        onPaymentComplete={handlePaymentComplete}
        onStockUpdated={handleStockUpdated}
      />
    </div>
  );
};

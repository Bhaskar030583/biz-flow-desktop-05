
import React, { useState, useEffect } from "react";
import { POSHeader } from "./POSHeader";
import { POSProductGrid } from "./POSProductGrid";
import { POSCartSidebar } from "./POSCartSidebar";
import { BillHistory } from "./BillHistory";
import { CustomerManagement } from "./CustomerManagement";
import { QuickStockUpdateModal } from "./QuickStockUpdateModal";
import { toast } from "sonner";

interface POSMainViewProps {
  onStockAdded: () => void;
  showSearch?: boolean;
  toggleSearch?: () => void;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity?: number;
  expectedClosing?: number;
}

export const POSMainView: React.FC<POSMainViewProps> = ({ 
  onStockAdded,
  showSearch = false,
  toggleSearch = () => {}
}) => {
  // Sample store info - this would come from your auth context or state
  const [storeInfo, setStoreInfo] = useState({
    storeName: "ABC Cafe",
    salespersonName: "John Doe",
    shiftName: "Morning Shift"
  });
  
  // States for the POS system
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showOrderSummary, setShowOrderSummary] = useState(true);
  const [showQuickStock, setShowQuickStock] = useState(false);
  const [showCustomerManagement, setShowCustomerManagement] = useState(false);
  const [showBillHistory, setShowBillHistory] = useState(false);
  
  // Sample products data
  const [products, setProducts] = useState<Product[]>([
    { id: "1", name: "Coffee", price: 120, category: "beverages", quantity: 50 },
    { id: "2", name: "Tea", price: 80, category: "beverages", quantity: 60 },
    { id: "3", name: "Sandwich", price: 150, category: "food", quantity: 20 },
    { id: "4", name: "Pasta", price: 220, category: "food", quantity: 15 },
    { id: "5", name: "Juice", price: 100, category: "beverages", quantity: 30 },
    { id: "6", name: "Cake", price: 180, category: "pastry", quantity: 10, expectedClosing: 8 },
    { id: "7", name: "Cookie", price: 50, category: "pastry", quantity: 40, expectedClosing: 35 },
    { id: "8", name: "Burger", price: 200, category: "food", quantity: 0 },
  ]);
  
  // Get unique categories
  const categories = ["all", ...new Set(products.map(product => product.category))];
  
  // Filter products based on search term and category
  const filteredProducts = products.filter(product => {
    const matchesTerm = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesTerm && matchesCategory;
  });

  console.log("POSMainView render - Current state:", {
    showCustomerManagement,
    showBillHistory,
    showOrderSummary,
    productsCount: products.length,
    filteredProductsCount: filteredProducts.length,
    cartItemsCount: cart.length
  });

  // Add product to cart
  const addToCart = (product: Product) => {
    if (product.quantity && product.quantity <= 0) return;
    
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingItemIndex !== -1) {
      // If the product is already in the cart, increase its quantity
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      updatedCart[existingItemIndex].total = updatedCart[existingItemIndex].quantity * updatedCart[existingItemIndex].price;
      setCart(updatedCart);
    } else {
      // If it's a new product, add it to the cart
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        total: product.price
      }]);
    }
    
    toast.success(`Added ${product.name} to cart`);
  };

  // Update quantity of an item in the cart
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    const updatedCart = cart.map(item => {
      if (item.id === productId) {
        return {
          ...item,
          quantity: newQuantity,
          total: item.price * newQuantity
        };
      }
      return item;
    });
    
    setCart(updatedCart);
  };

  // Remove an item from the cart
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  // Clear the cart
  const clearCart = () => {
    setCart([]);
  };

  // Get total amount
  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.total, 0);
  };

  // Handle payment methods
  const handleCashPayment = () => {
    toast.success("Processing cash payment...");
  };

  const handleUPIPayment = () => {
    toast.success("Processing UPI payment...");
  };

  const handleCreditPayment = () => {
    toast.success("Processing credit payment...");
  };

  const handleSplitPayment = () => {
    toast.success("Processing split payment...");
  };

  const handlePendingPayment = () => {
    toast.success("Saving as pending payment...");
  };

  // Handle Quick Stock
  const handleQuickStock = () => {
    setShowQuickStock(true);
  };

  // If showing customer management, render only that component
  if (showCustomerManagement) {
    console.log("Rendering Customer Management view");
    return (
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
        <POSHeader
          storeInfo={storeInfo}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showOrderSummary={showOrderSummary}
          setShowOrderSummary={setShowOrderSummary}
          onQuickStock={handleQuickStock}
          onCustomerManagement={() => setShowCustomerManagement(false)}
          onBillHistory={() => setShowBillHistory(true)}
          showSearch={showSearch}
          toggleSearch={toggleSearch}
        />
        <div className="flex-1 p-6">
          <CustomerManagement />
        </div>
      </div>
    );
  }

  // If showing bill history, render only that component
  if (showBillHistory) {
    console.log("Rendering Bill History view");
    return (
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
        <POSHeader
          storeInfo={storeInfo}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showOrderSummary={showOrderSummary}
          setShowOrderSummary={setShowOrderSummary}
          onQuickStock={handleQuickStock}
          onCustomerManagement={() => setShowCustomerManagement(true)}
          onBillHistory={() => setShowBillHistory(false)}
          showSearch={showSearch}
          toggleSearch={toggleSearch}
        />
        <div className="flex-1 p-6">
          <BillHistory />
        </div>
      </div>
    );
  }

  console.log("Rendering main POS view");
  
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <POSHeader
        storeInfo={storeInfo}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showOrderSummary={showOrderSummary}
        setShowOrderSummary={setShowOrderSummary}
        onQuickStock={handleQuickStock}
        onCustomerManagement={() => setShowCustomerManagement(true)}
        onBillHistory={() => setShowBillHistory(true)}
        showSearch={showSearch}
        toggleSearch={toggleSearch}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <POSProductGrid
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          filteredProducts={filteredProducts}
          selectedShopId="1"
          onAddToCart={addToCart}
          showSearch={showSearch}
        />
        
        {showOrderSummary && (
          <POSCartSidebar
            cart={cart}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            clearCart={clearCart}
            getTotalAmount={getTotalAmount}
            onCashPayment={handleCashPayment}
            onUPIPayment={handleUPIPayment}
            onCreditPayment={handleCreditPayment}
            onSplitPayment={handleSplitPayment}
            onPendingPayment={handlePendingPayment}
          />
        )}
      </div>
      
      {showQuickStock && (
        <QuickStockUpdateModal
          isOpen={showQuickStock}
          onClose={() => setShowQuickStock(false)}
          products={products}
          selectedShopId="1"
          onStockUpdated={onStockAdded}
        />
      )}
    </div>
  );
};

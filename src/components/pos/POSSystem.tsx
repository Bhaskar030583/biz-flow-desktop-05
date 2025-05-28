import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Users,
  Percent,
  DollarSign,
  X,
  CreditCard,
  LogOut,
  Palette,
  Receipt,
  CheckCircle,
  AlertCircle,
  Menu,
  ChevronLeft,
  ChevronRight,
  Clock
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { CashPaymentModal } from "./CashPaymentModal";
import { CreditPaymentModal } from "./CreditPaymentModal";
import { SplitPaymentModal } from "./SplitPaymentModal";
import { generateBill } from "@/services/billService";
import { toast } from "sonner";
import { useSettings } from "@/context/SettingsContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface Discount {
  type: 'percentage' | 'value';
  amount: number;
  description: string;
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
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [discountInput, setDiscountInput] = useState("");
  const [discountType, setDiscountType] = useState<'percentage' | 'value'>('percentage');
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [includeTax, setIncludeTax] = useState(false);
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const isMobile = useIsMobile();
  const { colorTheme, setColorTheme } = useSettings();

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

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCart(prev => 
      prev.map(item => {
        if (item.id === id) {
          return { ...item, quantity: newQuantity, total: newQuantity * item.price };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const getDiscountAmount = () => {
    if (!discount) return 0;
    const subtotal = getSubtotal();
    if (discount.type === 'percentage') {
      return (subtotal * discount.amount) / 100;
    }
    return Math.min(discount.amount, subtotal);
  };

  const getTaxAmount = () => {
    if (!includeTax) return 0;
    return (getSubtotal() - getDiscountAmount()) * 0.18;
  };

  const getTotalAmount = () => {
    return getSubtotal() - getDiscountAmount() + getTaxAmount();
  };

  const applyDiscount = () => {
    const amount = parseFloat(discountInput);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid discount amount");
      return;
    }

    if (discountType === 'percentage' && amount > 100) {
      toast.error("Percentage discount cannot exceed 100%");
      return;
    }

    const subtotal = getSubtotal();
    if (discountType === 'value' && amount > subtotal) {
      toast.error("Discount amount cannot exceed subtotal");
      return;
    }

    setDiscount({
      type: discountType,
      amount,
      description: discountType === 'percentage' ? `${amount}% off` : `₹${amount} off`
    });
    setDiscountInput("");
    setShowDiscountInput(false);
    toast.success("Discount applied successfully");
  };

  const removeDiscount = () => {
    setDiscount(null);
    toast.success("Discount removed");
  };

  const handleCashPayment = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    console.log("Opening cash payment modal");
    setShowCashModal(true);
  };

  const handleUPIPayment = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    console.log("Processing UPI payment");
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
      setDiscount(null);
    } catch (error) {
      console.error("Error processing UPI payment:", error);
      toast.error("Failed to process UPI payment");
    }
  };

  const handleCreditPayment = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    console.log("Opening credit payment modal");
    setShowCreditModal(true);
  };

  const handleSplitPayment = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    console.log("Opening split payment modal");
    setShowSplitModal(true);
  };

  const handleCompletePayment = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    try {
      await generateBill({
        totalAmount: getTotalAmount(),
        paymentMethod: 'cash',
        cartItems: cart,
        storeName: storeInfo?.storeName,
        salespersonName: storeInfo?.salespersonName
      });

      toast.success("Payment completed and bill generated!");
      setCart([]);
      setDiscount(null);
    } catch (error) {
      console.error("Error processing complete payment:", error);
      toast.error("Failed to process payment");
    }
  };

  const handlePendingPayment = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    try {
      await generateBill({
        totalAmount: getTotalAmount(),
        paymentMethod: 'credit',
        cartItems: cart,
        storeName: storeInfo?.storeName,
        salespersonName: storeInfo?.salespersonName
      });

      toast.success("Pending payment recorded and bill generated!");
      setCart([]);
      setDiscount(null);
    } catch (error) {
      console.error("Error processing pending payment:", error);
      toast.error("Failed to process pending payment");
    }
  };

  const handlePaymentComplete = () => {
    setCart([]);
    setDiscount(null);
    setShowCashModal(false);
    setShowCreditModal(false);
    setShowSplitModal(false);
  };

  const handleExit = () => {
    if (cart.length > 0) {
      const confirmed = window.confirm("You have items in your cart. Are you sure you want to exit?");
      if (!confirmed) return;
    }
    
    if (window.opener) {
      window.close();
    } else {
      window.location.href = '/';
    }
  };

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getGridCols = () => {
    switch (gridSize) {
      case 'small': return 'grid-cols-7 lg:grid-cols-8';
      case 'medium': return 'grid-cols-6 lg:grid-cols-7';
      case 'large': return 'grid-cols-5 lg:grid-cols-6';
      default: return 'grid-cols-6 lg:grid-cols-7';
    }
  };

  const getCardSize = () => {
    switch (gridSize) {
      case 'small': return { cardClass: 'h-16', titleSize: 'text-xs', priceSize: 'text-sm' };
      case 'medium': return { cardClass: 'h-20', titleSize: 'text-sm', priceSize: 'text-base' };
      case 'large': return { cardClass: 'h-24', titleSize: 'text-base', priceSize: 'text-lg' };
      default: return { cardClass: 'h-20', titleSize: 'text-sm', priceSize: 'text-base' };
    }
  };

  const cardConfig = getCardSize();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-color-theme', colorTheme);
    console.log('Applied theme to POS:', colorTheme);
  }, [colorTheme]);

  const themeOptions = [
    { value: 'default', label: 'Default', color: 'bg-blue-500' },
    { value: 'professional', label: 'Professional', color: 'bg-gray-700' },
    { value: 'modern', label: 'Modern', color: 'bg-purple-500' },
    { value: 'vibrant', label: 'Vibrant', color: 'bg-green-500' }
  ];

  const getThemeColors = () => {
    switch (colorTheme) {
      case 'professional':
        return {
          gradient: 'from-gray-600 to-gray-800',
          hover: 'hover:from-gray-700 hover:to-gray-900',
          accent: 'bg-gray-600 hover:bg-gray-700',
          light: 'bg-gray-100',
          text: 'text-gray-700'
        };
      case 'modern':
        return {
          gradient: 'from-purple-500 to-purple-700',
          hover: 'hover:from-purple-600 hover:to-purple-800',
          accent: 'bg-purple-600 hover:bg-purple-700',
          light: 'bg-purple-50',
          text: 'text-purple-700'
        };
      case 'vibrant':
        return {
          gradient: 'from-green-500 to-green-700',
          hover: 'hover:from-green-600 hover:to-green-800',
          accent: 'bg-green-600 hover:bg-green-700',
          light: 'bg-green-50',
          text: 'text-green-700'
        };
      default:
        return {
          gradient: 'from-blue-500 to-indigo-600',
          hover: 'hover:from-blue-600 hover:to-indigo-700',
          accent: 'bg-blue-500 hover:bg-blue-600',
          light: 'bg-blue-50',
          text: 'text-blue-700'
        };
    }
  };

  const themeColors = getThemeColors();

  useEffect(() => {
    if (isMobile) {
      setGridSize('small');
    }
  }, [isMobile]);

  const getMobileGridCols = () => {
    if (isMobile) {
      return 'grid-cols-3 sm:grid-cols-4';
    }
    switch (gridSize) {
      case 'small': return 'grid-cols-6 lg:grid-cols-7';
      case 'medium': return 'grid-cols-4 lg:grid-cols-5';
      case 'large': return 'grid-cols-3 lg:grid-cols-4';
      default: return 'grid-cols-4 lg:grid-cols-5';
    }
  };

  const getMobileCardSize = () => {
    if (isMobile) {
      return { cardClass: 'h-16', titleSize: 'text-xs', priceSize: 'text-sm' };
    }
    return getCardSize();
  };

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100" data-color-theme={colorTheme}>
        {/* Enhanced Mobile Header */}
        <div className={`flex items-center justify-between p-4 bg-gradient-to-r ${themeColors.gradient} shadow-2xl border-b border-white/20`}>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-white hover:bg-white/20 h-10 w-10 p-0 rounded-xl transition-all duration-200"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center">
                <img 
                  src="/lovable-uploads/528f105b-5de5-4806-a64a-99582022753b.png" 
                  alt="ABC Cafe Logo" 
                  className="w-7 h-7 rounded-lg object-cover"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">ABC CAFE</h2>
                <p className="text-white/90 text-sm font-medium">Point of Sale</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCart(!showCart)}
              className="text-white hover:bg-white/20 h-10 w-10 p-0 relative rounded-xl transition-all duration-200"
            >
              <ShoppingCart className="h-5 w-5" />
              {cart.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-6 w-6 p-0 bg-red-500 text-white text-xs flex items-center justify-center rounded-full border-2 border-white">
                  {cart.length}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExit}
              className="text-white hover:bg-white/20 h-10 w-10 p-0 rounded-xl transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Enhanced Mobile Sidebar */}
        {showSidebar && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowSidebar(false)}>
            <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className={`p-4 border-b bg-gradient-to-r ${themeColors.gradient}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Categories</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSidebar(false)}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-100px)]">
                {categories.map(category => {
                  const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || LayoutGrid;
                  const isActive = selectedCategory === category;
                  return (
                    <Button
                      key={category}
                      variant={isActive ? "default" : "ghost"}
                      className={`w-full justify-start gap-3 h-14 text-left rounded-xl transition-all duration-200 ${
                        isActive 
                          ? `bg-gradient-to-r ${themeColors.gradient} text-white shadow-lg` 
                          : `text-gray-700 hover:bg-gray-100 hover:shadow-md`
                      }`}
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowSidebar(false);
                      }}
                    >
                      <IconComponent className="h-5 w-5" />
                      <span className="font-semibold">
                        {category === "all" ? "All Items" : category}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Mobile Cart */}
        {showCart && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowCart(false)}>
            <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="h-full flex flex-col">
                <div className={`p-4 border-b bg-gradient-to-r ${themeColors.gradient}`}>
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <h2 className="text-xl font-bold">Order Summary</h2>
                      <p className="text-white/90 text-sm">Review your items</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCart(false)}
                      className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-lg"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <ShoppingCart className="h-10 w-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Empty Cart</h3>
                      <p className="text-sm">Add items from the menu</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item, index) => (
                        <Card key={item.id} className="p-3 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm text-gray-800">{item.name}</h4>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFromCart(item.id)}
                                className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 rounded-lg"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="font-bold text-base w-8 text-center">
                                  {item.quantity}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 rounded-lg"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <span className="font-bold text-gray-900">₹{item.total}</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <>
                    <div className="p-4 border-t bg-gray-50 rounded-t-xl">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span className="font-semibold">₹{getSubtotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t">
                          <span>Total</span>
                          <span>₹{getTotalAmount().toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <Button 
                          size="sm" 
                          className={`${themeColors.accent} h-12 text-xs font-semibold rounded-xl shadow-lg`}
                          onClick={handleCashPayment}
                        >
                          <Banknote className="h-4 w-4 mr-1" />
                          Cash
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700 h-12 text-xs font-semibold rounded-xl shadow-lg"
                          onClick={handleUPIPayment}
                        >
                          <Smartphone className="h-4 w-4 mr-1" />
                          UPI
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Button 
                          className="bg-green-600 hover:bg-green-700 h-12 text-sm font-bold rounded-xl shadow-lg"
                          onClick={handleCompletePayment}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Complete
                        </Button>
                        <Button 
                          className="bg-orange-600 hover:bg-orange-700 h-12 text-sm font-bold rounded-xl shadow-lg"
                          onClick={handlePendingPayment}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Pending
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Mobile Main Content */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-sm rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-200 shadow-sm"
              />
            </div>
          </div>

          <div className={`grid ${getMobileGridCols()} gap-3 overflow-y-auto h-[calc(100vh-180px)]`}>
            {filteredProducts.map(product => {
              const cardConfig = getMobileCardSize();
              return (
                <Card
                  key={product.id}
                  className={`cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 hover:scale-105 bg-white ${cardConfig.cardClass} group rounded-xl`}
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-3 h-full flex flex-col justify-between">
                    <div className="text-center flex-1">
                      <h3 className={`font-bold text-gray-700 ${cardConfig.titleSize} mb-1 line-clamp-2 leading-tight`}>
                        {product.name}
                      </h3>
                      <span className={`font-bold text-gray-900 ${cardConfig.priceSize}`}>
                        ₹{product.price}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        Qty: {product.quantity || 0}
                      </span>
                      <Button
                        size="sm"
                        className={`bg-gradient-to-r ${themeColors.gradient} text-white h-6 w-6 p-0 shadow-lg rounded-full group-hover:scale-110 transition-transform duration-200`}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Enhanced Floating Cart Button */}
        {cart.length > 0 && !showCart && (
          <div className="fixed bottom-6 right-6 z-40">
            <Button
              className={`bg-gradient-to-r ${themeColors.gradient} text-white shadow-2xl rounded-full h-16 w-16 p-0 hover:scale-110 transition-all duration-200`}
              onClick={() => setShowCart(true)}
            >
              <div className="text-center">
                <ShoppingCart className="h-6 w-6 mx-auto mb-1" />
                <span className="text-xs font-bold">{cart.length}</span>
              </div>
            </Button>
          </div>
        )}

        {/* Keep existing modals */}
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
  }

  // Enhanced Desktop Layout
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100" data-color-theme={colorTheme}>
      {/* Enhanced Desktop Sidebar */}
      <div className="w-60 bg-white shadow-2xl flex flex-col border-r border-gray-100">
        <div className={`p-4 border-b bg-gradient-to-r ${themeColors.gradient} shadow-lg`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl shadow-lg ring-2 ring-white/20 flex items-center justify-center">
                <img 
                  src="/lovable-uploads/528f105b-5de5-4806-a64a-99582022753b.png" 
                  alt="ABC Cafe Logo" 
                  className="w-7 h-7 rounded-lg object-cover"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">ABC CAFE</h2>
                <p className="text-white/90 text-sm font-medium">Point of Sale</p>
              </div>
            </div>
            
            <div className="flex gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-lg"
                    title="Change Theme"
                  >
                    <Palette className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-white border border-gray-200 shadow-xl z-50 rounded-xl">
                  {themeOptions.map((theme) => (
                    <DropdownMenuItem
                      key={theme.value}
                      onClick={() => setColorTheme(theme.value as any)}
                      className={`cursor-pointer p-3 rounded-lg ${colorTheme === theme.value ? 'bg-gray-100' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${theme.color} shadow-sm`} />
                        <span className="font-medium text-sm">{theme.label}</span>
                        {colorTheme === theme.value && <CheckCircle className="ml-auto h-4 w-4 text-green-600" />}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleExit}
                className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-lg"
                title="Exit POS"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Categories
          </h3>
          <div className="space-y-2">
            {categories.map(category => {
              const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || LayoutGrid;
              const isActive = selectedCategory === category;
              return (
                <Button
                  key={category}
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 h-12 text-left rounded-xl transition-all duration-200 text-sm ${
                    isActive 
                      ? `bg-gradient-to-r ${themeColors.gradient} text-white ${themeColors.hover} shadow-lg` 
                      : `text-gray-700 hover:bg-gray-100 hover:shadow-md`
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  <IconComponent className={`h-4 w-4 ${isActive ? 'text-white' : themeColors.text}`} />
                  <span className="font-semibold">
                    {category === "all" ? "All Items" : category}
                  </span>
                  {isActive && <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>}
                </Button>
              );
            })}
          </div>
        </div>

        {storeInfo && (
          <div className="p-4 border-t bg-gradient-to-r from-gray-50 to-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Session Info
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 p-2 bg-white rounded-xl shadow-sm">
                <Store className="h-4 w-4 text-blue-600" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 text-sm truncate">{storeInfo.storeName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white rounded-xl shadow-sm">
                <User className="h-4 w-4 text-green-600" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 text-sm truncate">{storeInfo.salespersonName}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-6 overflow-hidden">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-1">Product Menu</h1>
                <p className="text-gray-600">Select items to add to your order</p>
              </div>
              
              <div className="flex items-center gap-4">
                <Label className="text-sm font-medium text-gray-700">Grid Size:</Label>
                <div className="flex items-center gap-1 bg-white rounded-xl p-1 border shadow-sm">
                  <Button
                    variant={gridSize === 'small' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGridSize('small')}
                    className={`h-8 w-8 p-0 rounded-lg ${gridSize === 'small' ? `${themeColors.accent}` : ''}`}
                    title="Small Grid"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={gridSize === 'medium' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGridSize('medium')}
                    className={`h-8 w-8 p-0 rounded-lg ${gridSize === 'medium' ? `${themeColors.accent}` : ''}`}
                    title="Medium Grid"
                  >
                    <Grid2X2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={gridSize === 'large' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGridSize('large')}
                    className={`h-8 w-8 p-0 rounded-lg ${gridSize === 'large' ? `${themeColors.accent}` : ''}`}
                    title="Large Grid"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search products by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-base border-gray-200 focus:border-blue-400 focus:ring-blue-200 rounded-xl shadow-sm"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-lg"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className={`grid ${getGridCols()} gap-4 overflow-y-auto h-[calc(100vh-340px)] pr-2`}>
            {filteredProducts.map(product => (
              <Card
                key={product.id}
                className={`cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 hover:scale-105 bg-white ${cardConfig.cardClass} group rounded-xl`}
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4 h-full flex flex-col justify-between">
                  <div className="flex-1 flex flex-col justify-between">
                    <h3 className={`font-bold ${themeColors.text} ${cardConfig.titleSize} mb-2 line-clamp-2 leading-tight`}>
                      {product.name}
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-gray-900 ${cardConfig.priceSize}`}>
                          ₹{product.price}
                        </span>
                        <Button
                          size="sm"
                          className={`bg-gradient-to-r ${themeColors.gradient} ${themeColors.hover} text-white h-8 w-8 p-0 shadow-lg rounded-full group-hover:scale-110 transition-transform duration-200`}
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-center">
                        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                          Stock: {product.quantity || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredProducts.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-500">
                <div className="w-24 h-24 bg-gray-100 rounded-full mb-4 flex items-center justify-center">
                  <Search className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-center">Try adjusting your search or category filter</p>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Order Summary */}
        <div className="bg-white shadow-2xl border-t border-gray-100">
          <div className="h-full flex flex-col max-h-96">
            <div className={`p-4 bg-gradient-to-r ${themeColors.gradient} shadow-lg`}>
              <div className="flex items-center justify-between text-white">
                <div>
                  <h2 className="text-xl font-bold">Order Summary</h2>
                  <p className="text-white/90 text-sm">Review and complete your order</p>
                </div>
                <Badge variant="secondary" className={`bg-white ${themeColors.text} font-bold text-sm px-4 py-2 rounded-xl`}>
                  {cart.length} items
                </Badge>
              </div>
            </div>

            <div className="flex-1 flex">
              <div className="flex-1 p-4 overflow-x-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <ShoppingCart className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Empty Cart</h3>
                    <p className="text-sm">Add items from the menu to get started</p>
                  </div>
                ) : (
                  <div className="flex gap-4 min-w-max">
                    {cart.map((item, index) => (
                      <Card key={item.id} className="p-4 hover:shadow-lg transition-shadow duration-200 min-w-[280px] rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3">
                              <Badge variant="outline" className={`${themeColors.text} border-2 px-3 py-1 text-sm font-bold flex-shrink-0 rounded-lg`}>
                                #{index + 1}
                              </Badge>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-gray-800 text-sm truncate">{item.name}</h4>
                                <p className="text-sm text-gray-500">₹{item.price} each</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mx-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 rounded-lg"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-bold text-base min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 rounded-lg"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-900 text-base min-w-[60px] text-right">₹{item.total}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(item.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="w-96 border-l bg-gray-50">
                  <div className="p-4">
                    {!discount && !showDiscountInput && (
                      <Button
                        variant="outline"
                        className={`w-full flex items-center gap-2 border-2 ${themeColors.text} hover:bg-blue-50 h-10 text-sm font-medium rounded-xl`}
                        onClick={() => setShowDiscountInput(true)}
                      >
                        <Percent className="h-4 w-4" />
                        Add Discount
                      </Button>
                    )}

                    {showDiscountInput && (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Button
                            variant={discountType === 'percentage' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDiscountType('percentage')}
                            className={discountType === 'percentage' ? `${themeColors.accent} h-8 px-3 text-sm rounded-lg` : 'h-8 px-3 text-sm rounded-lg'}
                          >
                            <Percent className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={discountType === 'value' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDiscountType('value')}
                            className={discountType === 'value' ? `${themeColors.accent} h-8 px-3 text-sm rounded-lg` : 'h-8 px-3 text-sm rounded-lg'}
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder={discountType === 'percentage' ? 'Enter %' : 'Enter ₹'}
                            value={discountInput}
                            onChange={(e) => setDiscountInput(e.target.value)}
                            className="flex-1 h-8 text-sm rounded-lg"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                applyDiscount();
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={applyDiscount}
                            className="bg-green-600 hover:bg-green-700 h-8 px-3 text-sm rounded-lg"
                          >
                            Apply
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowDiscountInput(false)}
                            className="h-8 px-2 rounded-lg"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {discount && (
                      <Card className="p-3 bg-green-50 border-2 border-green-200 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-800">{discount.description}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={removeDiscount}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 rounded-lg"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    )}
                  </div>

                  <div className="p-4 border-t">
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                      <Label htmlFor="tax-toggle" className="text-sm font-semibold text-gray-700">
                        Include Tax (18%)
                      </Label>
                      <Switch
                        id="tax-toggle"
                        checked={includeTax}
                        onCheckedChange={setIncludeTax}
                      />
                    </div>
                  </div>

                  <Separator />
                  
                  <div className="p-4 space-y-3 bg-white">
                    <div className="flex justify-between text-gray-600 text-sm">
                      <span>Subtotal</span>
                      <span className="font-semibold">₹{getSubtotal().toFixed(2)}</span>
                    </div>
                    
                    {discount && (
                      <div className="flex justify-between text-green-600 text-sm">
                        <span>Discount ({discount.description})</span>
                        <span className="font-semibold">-₹{getDiscountAmount().toFixed(2)}</span>
                      </div>
                    )}
                    
                    {includeTax && (
                      <div className="flex justify-between text-gray-600 text-sm">
                        <span>Tax (18%)</span>
                        <span className="font-semibold">₹{getTaxAmount().toFixed(2)}</span>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between text-xl font-bold text-gray-900 p-3 bg-gray-50 rounded-xl">
                      <span>Total</span>
                      <span>₹{getTotalAmount().toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 border-t bg-gray-50">
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`flex items-center gap-2 border-2 ${themeColors.text} hover:bg-blue-50 h-10 text-sm font-semibold rounded-xl`}
                        onClick={handleCashPayment}
                      >
                        <Banknote className="h-4 w-4" />
                        Cash
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-2 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 h-10 text-sm font-semibold rounded-xl"
                        onClick={handleUPIPayment}
                      >
                        <Smartphone className="h-4 w-4" />
                        UPI
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-2 border-2 border-purple-200 text-purple-600 hover:bg-purple-50 h-10 text-sm font-semibold rounded-xl"
                        onClick={handleCreditPayment}
                      >
                        <UserCheck className="h-4 w-4" />
                        Credit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-2 border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 h-10 text-sm font-semibold rounded-xl"
                        onClick={handleSplitPayment}
                      >
                        <Split className="h-4 w-4" />
                        Split
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 h-12 text-base font-bold shadow-xl rounded-xl"
                        onClick={handleCompletePayment}
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Complete
                      </Button>
                      <Button 
                        className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 h-12 text-base font-bold shadow-xl rounded-xl"
                        onClick={handlePendingPayment}
                      >
                        <Clock className="h-5 w-5 mr-2" />
                        Pending
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
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

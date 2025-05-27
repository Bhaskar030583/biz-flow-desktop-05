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
  ChevronRight
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

  const handleCardPayment = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    try {
      await generateBill({
        totalAmount: getTotalAmount(),
        paymentMethod: 'card',
        cartItems: cart,
        storeName: storeInfo?.storeName,
        salespersonName: storeInfo?.salespersonName
      });

      toast.success("Card payment completed and bill generated!");
      setCart([]);
      setDiscount(null);
    } catch (error) {
      console.error("Error processing card payment:", error);
      toast.error("Failed to process card payment");
    }
  };

  const handlePaymentComplete = () => {
    setCart([]);
    setDiscount(null);
    setShowCashModal(false);
    setShowCreditModal(false);
    setShowSplitModal(false);
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
      case 'small': return 'grid-cols-5';
      case 'medium': return 'grid-cols-4';
      case 'large': return 'grid-cols-3';
      default: return 'grid-cols-4';
    }
  };

  const getCardSize = () => {
    switch (gridSize) {
      case 'small': return { cardClass: 'h-28', iconSize: 'h-8 w-8', titleSize: 'text-xs', priceSize: 'text-sm' };
      case 'medium': return { cardClass: 'h-36', iconSize: 'h-12 w-12', titleSize: 'text-sm', priceSize: 'text-lg' };
      case 'large': return { cardClass: 'h-44', iconSize: 'h-16 w-16', titleSize: 'text-base', priceSize: 'text-xl' };
      default: return { cardClass: 'h-36', iconSize: 'h-12 w-12', titleSize: 'text-sm', priceSize: 'text-lg' };
    }
  };

  const cardConfig = getCardSize();

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
          gradient: 'from-orange-500 to-red-500',
          hover: 'hover:from-orange-600 hover:to-red-600',
          accent: 'bg-orange-500 hover:bg-orange-600',
          light: 'bg-orange-50',
          text: 'text-orange-700'
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
      return 'grid-cols-2 sm:grid-cols-3';
    }
    switch (gridSize) {
      case 'small': return 'grid-cols-5 lg:grid-cols-6';
      case 'medium': return 'grid-cols-3 lg:grid-cols-4';
      case 'large': return 'grid-cols-2 lg:grid-cols-3';
      default: return 'grid-cols-3 lg:grid-cols-4';
    }
  };

  const getMobileCardSize = () => {
    if (isMobile) {
      return { cardClass: 'h-32', iconSize: 'h-8 w-8', titleSize: 'text-xs', priceSize: 'text-sm' };
    }
    return getCardSize();
  };

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100" data-color-theme={colorTheme}>
        {/* Mobile Header */}
        <div className={`flex items-center justify-between p-4 bg-gradient-to-r ${themeColors.gradient} shadow-lg`}>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-white hover:bg-white/20 h-9 w-9 p-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/528f105b-5de5-4806-a64a-99582022753b.png" 
                alt="ABC Cafe Logo" 
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <h2 className="text-lg font-bold text-white">ABC CAFE</h2>
                <p className="text-white/80 text-xs">POS System</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCart(!showCart)}
              className="text-white hover:bg-white/20 h-9 w-9 p-0 relative"
            >
              <ShoppingCart className="h-5 w-5" />
              {cart.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-500 text-white text-xs flex items-center justify-center">
                  {cart.length}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExit}
              className="text-white hover:bg-white/20 h-9 w-9 p-0"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {showSidebar && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowSidebar(false)}>
            <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Categories</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSidebar(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-120px)]">
                {categories.map(category => {
                  const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || LayoutGrid;
                  const isActive = selectedCategory === category;
                  return (
                    <Button
                      key={category}
                      variant={isActive ? "default" : "ghost"}
                      className={`w-full justify-start gap-3 h-12 text-left ${
                        isActive 
                          ? `bg-gradient-to-r ${themeColors.gradient} text-white` 
                          : `text-gray-700 hover:bg-gray-100`
                      }`}
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowSidebar(false);
                      }}
                    >
                      <IconComponent className="h-5 w-5" />
                      <span className="font-medium">
                        {category === "all" ? "All Items" : category}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Cart Overlay */}
        {showCart && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowCart(false)}>
            <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              {/* Mobile Cart Content - same as desktop but in overlay */}
              <div className="h-full flex flex-col">
                <div className={`p-4 border-b bg-gradient-to-r ${themeColors.gradient}`}>
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <h2 className="text-lg font-bold">Current Order</h2>
                      <p className="text-white/80 text-sm">Review your items</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCart(false)}
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Cart Items - Mobile optimized */}
                <div className="flex-1 p-4 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <h3 className="text-lg font-semibold mb-2">Empty Cart</h3>
                      <p className="text-sm">Add items from the menu</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item, index) => (
                        <Card key={item.id} className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm">{item.name}</h4>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFromCart(item.id)}
                                className="h-6 w-6 p-0 text-red-500"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
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
                                  className="h-8 w-8 p-0"
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
                    {/* Mobile Payment Summary */}
                    <div className="p-4 border-t bg-gray-50">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span className="font-semibold">₹{getSubtotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span>₹{getTotalAmount().toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <Button 
                          size="sm" 
                          className={`${themeColors.accent} h-12 text-xs`}
                          onClick={handleCashPayment}
                        >
                          <Banknote className="h-4 w-4 mr-1" />
                          Cash
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700 h-12 text-xs"
                          onClick={handleUPIPayment}
                        >
                          <Smartphone className="h-4 w-4 mr-1" />
                          UPI
                        </Button>
                      </div>
                      
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 h-12 mt-2 text-sm font-bold"
                        onClick={handleCardPayment}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay with Card
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Main Content */}
        <div className="flex-1 p-4 overflow-hidden">
          {/* Mobile Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 text-sm"
              />
            </div>
          </div>

          {/* Mobile Products Grid */}
          <div className={`grid ${getMobileGridCols()} gap-3 overflow-y-auto h-[calc(100vh-160px)]`}>
            {filteredProducts.map(product => {
              const cardConfig = getMobileCardSize();
              return (
                <Card
                  key={product.id}
                  className={`cursor-pointer hover:shadow-lg transition-all duration-200 border hover:border-orange-300 ${cardConfig.cardClass}`}
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-3 h-full flex flex-col">
                    <div className="aspect-square bg-orange-50 rounded-lg mb-2 flex items-center justify-center">
                      <UtensilsCrossed className={`${cardConfig.iconSize} text-orange-600`} />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between">
                      <h3 className={`font-bold text-gray-700 ${cardConfig.titleSize} mb-1 line-clamp-2 leading-tight`}>
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-gray-900 ${cardConfig.priceSize}`}>
                          ₹{product.price}
                        </span>
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 text-white h-6 w-6 p-0 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Floating Cart Summary for Mobile */}
        {cart.length > 0 && !showCart && (
          <div className="fixed bottom-4 right-4 z-40">
            <Button
              className={`bg-gradient-to-r ${themeColors.gradient} text-white shadow-lg rounded-full h-14 w-14 p-0`}
              onClick={() => setShowCart(true)}
            >
              <div className="text-center">
                <ShoppingCart className="h-5 w-5 mx-auto" />
                <span className="text-xs font-bold">{cart.length}</span>
              </div>
            </Button>
          </div>
        )}

        {/* Mobile Modals */}
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

  // Desktop layout with adjusted sidebar width and order summary position
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100" data-color-theme={colorTheme}>
      {/* Narrower Desktop Left Sidebar */}
      <div className="w-64 bg-white shadow-xl flex flex-col border-r border-gray-200">
        {/* Enhanced Logo Section */}
        <div className={`p-4 border-b bg-gradient-to-r ${themeColors.gradient} shadow-lg`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/20">
                <img 
                  src="/lovable-uploads/528f105b-5de5-4806-a64a-99582022753b.png" 
                  alt="ABC Cafe Logo" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">ABC CAFE</h2>
                <p className="text-white/80 text-xs">POS System</p>
              </div>
            </div>
            
            {/* Control buttons */}
            <div className="flex gap-1">
              {/* Theme Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-full"
                    title="Change Theme"
                  >
                    <Palette className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-white border border-gray-200 shadow-xl z-50">
                  {themeOptions.map((theme) => (
                    <DropdownMenuItem
                      key={theme.value}
                      onClick={() => setColorTheme(theme.value as any)}
                      className={`cursor-pointer p-3 ${colorTheme === theme.value ? 'bg-gray-100' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${theme.color} shadow-sm`} />
                        <span className="font-medium text-sm">{theme.label}</span>
                        {colorTheme === theme.value && <CheckCircle className="ml-auto h-3 w-3 text-green-600" />}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Exit Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleExit}
                className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-full"
                title="Exit POS"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Category Navigation */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Categories
          </h3>
          <div className="space-y-1">
            {categories.map(category => {
              const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || LayoutGrid;
              const isActive = selectedCategory === category;
              return (
                <Button
                  key={category}
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start gap-2 h-10 text-left rounded-lg transition-all duration-200 ${
                    isActive 
                      ? `bg-gradient-to-r ${themeColors.gradient} text-white ${themeColors.hover} shadow-md` 
                      : `text-gray-700 hover:bg-gray-100 hover:${themeColors.text} hover:shadow-sm`
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  <IconComponent className={`h-4 w-4 ${isActive ? 'text-white' : themeColors.text}`} />
                  <span className="font-medium text-sm">
                    {category === "all" ? "All Items" : category}
                  </span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Enhanced Store Info */}
        {storeInfo && (
          <div className="p-4 border-t bg-gradient-to-r from-gray-50 to-gray-100">
            <h3 className="text-xs font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <AlertCircle className="h-3 w-3" />
              Session Info
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 p-2 bg-white rounded-md shadow-sm">
                <Store className="h-3 w-3 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-800 text-xs">{storeInfo.storeName}</p>
                  <p className="text-xs text-gray-500">Store</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white rounded-md shadow-sm">
                <User className="h-3 w-3 text-green-600" />
                <div>
                  <p className="font-medium text-gray-800 text-xs">{storeInfo.salespersonName}</p>
                  <p className="text-xs text-gray-500">Cashier</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area - Now Full Width */}
      <div className="flex-1 flex flex-col">
        {/* Enhanced Products Section */}
        <div className="flex-1 p-6 overflow-hidden">
          {/* Enhanced Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Products</h1>
                <p className="text-gray-600">Select items to add to cart</p>
              </div>
              
              {/* Grid Size Controls */}
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium text-gray-700">View:</Label>
                <div className="flex items-center gap-1 bg-white rounded-lg p-1 border shadow-sm">
                  <Button
                    variant={gridSize === 'small' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGridSize('small')}
                    className={`h-8 w-8 p-0 ${gridSize === 'small' ? `${themeColors.accent}` : ''}`}
                    title="Small Grid"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={gridSize === 'medium' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGridSize('medium')}
                    className={`h-8 w-8 p-0 ${gridSize === 'medium' ? `${themeColors.accent}` : ''}`}
                    title="Medium Grid"
                  >
                    <Grid2X2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={gridSize === 'large' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGridSize('large')}
                    className={`h-8 w-8 p-0 ${gridSize === 'large' ? `${themeColors.accent}` : ''}`}
                    title="Large Grid"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Enhanced Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search products by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-12 h-12 text-base border-gray-300 focus:border-${themeColors.text.split('-')[1]}-400 focus:ring-${themeColors.text.split('-')[1]}-200 rounded-xl shadow-sm`}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Enhanced Products Grid - Now takes more space */}
          <div className={`grid ${getGridCols()} gap-4 overflow-y-auto h-[calc(100vh-320px)] pr-2`}>
            {filteredProducts.map(product => (
              <Card
                key={product.id}
                className={`cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-${themeColors.text.split('-')[1]}-300 hover:scale-105 bg-white ${cardConfig.cardClass} group`}
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4 h-full flex flex-col">
                  <div className={`aspect-square bg-gradient-to-br ${themeColors.light} rounded-xl mb-3 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <UtensilsCrossed className={`${cardConfig.iconSize} ${themeColors.text} group-hover:animate-pulse`} />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <h3 className={`font-bold ${themeColors.text} ${cardConfig.titleSize} mb-2 line-clamp-2 min-h-[2.5rem] leading-tight`}>
                      {product.name}
                    </h3>
                    
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
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredProducts.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                <Search className="h-16 w-16 mb-4 opacity-30" />
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-center">Try adjusting your search or category filter</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary Section - Now Below Products */}
        <div className="bg-white shadow-xl border-t border-gray-200">
          <div className="h-full flex flex-col max-h-80">
            {/* Enhanced Header */}
            <div className={`p-4 bg-gradient-to-r ${themeColors.gradient} shadow-lg`}>
              <div className="flex items-center justify-between text-white">
                <div>
                  <h2 className="text-lg font-bold">Current Order</h2>
                  <p className="text-white/80 text-sm">Review your items</p>
                </div>
                <Badge variant="secondary" className={`bg-white ${themeColors.text} font-bold text-sm px-3 py-1`}>
                  {cart.length} items
                </Badge>
              </div>
            </div>

            <div className="flex-1 flex">
              {/* Cart Items - Horizontal Scroll */}
              <div className="flex-1 p-4 overflow-x-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <h3 className="text-base font-semibold mb-1">Empty Cart</h3>
                    <p className="text-sm">Add items from the menu to get started</p>
                  </div>
                ) : (
                  <div className="flex gap-3 min-w-max">
                    {cart.map((item, index) => (
                      <Card key={item.id} className="p-3 hover:shadow-md transition-shadow duration-200 min-w-[250px]">
                        <div className="flex items-center justify-between">
                          {/* Left side: Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <Badge variant="outline" className={`${themeColors.text} border-${themeColors.text.split('-')[1]}-200 px-2 py-1 text-xs font-bold flex-shrink-0`}>
                                #{index + 1}
                              </Badge>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-gray-800 text-sm truncate">{item.name}</h4>
                                <p className="text-xs text-gray-500">₹{item.price} each</p>
                              </div>
                            </div>
                          </div>

                          {/* Center: Quantity controls */}
                          <div className="flex items-center gap-2 mx-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0 rounded-full"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-bold text-sm min-w-[1.5rem] text-center">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0 rounded-full"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Right side: Total and Delete */}
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm min-w-[50px] text-right">₹{item.total}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(item.id)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="w-80 border-l bg-gray-50">
                  {/* Enhanced Discount Section */}
                  <div className="p-3">
                    {!discount && !showDiscountInput && (
                      <Button
                        variant="outline"
                        className={`w-full flex items-center gap-2 border-${themeColors.text.split('-')[1]}-200 ${themeColors.text} hover:bg-${themeColors.text.split('-')[1]}-50 h-8 text-xs font-medium rounded-lg`}
                        onClick={() => setShowDiscountInput(true)}
                      >
                        <Percent className="h-3 w-3" />
                        Add Discount
                      </Button>
                    )}

                    {showDiscountInput && (
                      <div className="space-y-2">
                        <div className="flex gap-1">
                          <Button
                            variant={discountType === 'percentage' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDiscountType('percentage')}
                            className={discountType === 'percentage' ? `${themeColors.accent} h-6 px-2 text-xs` : 'h-6 px-2 text-xs'}
                          >
                            <Percent className="h-3 w-3" />
                          </Button>
                          <Button
                            variant={discountType === 'value' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDiscountType('value')}
                            className={discountType === 'value' ? `${themeColors.accent} h-6 px-2 text-xs` : 'h-6 px-2 text-xs'}
                          >
                            <DollarSign className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            placeholder={discountType === 'percentage' ? 'Enter %' : 'Enter ₹'}
                            value={discountInput}
                            onChange={(e) => setDiscountInput(e.target.value)}
                            className="flex-1 h-6 text-xs"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                applyDiscount();
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={applyDiscount}
                            className="bg-green-600 hover:bg-green-700 h-6 px-2 text-xs"
                          >
                            Apply
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowDiscountInput(false)}
                            className="h-6 px-1"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {discount && (
                      <Card className="p-2 bg-green-50 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Percent className="h-3 w-3 text-green-600" />
                            <span className="text-xs font-semibold text-green-800">{discount.description}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={removeDiscount}
                            className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Enhanced Tax Toggle */}
                  <div className="p-3 border-t">
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm">
                      <Label htmlFor="tax-toggle" className="text-xs font-semibold text-gray-700">
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
                  
                  {/* Enhanced Order Summary */}
                  <div className="p-3 space-y-2 bg-white">
                    <div className="flex justify-between text-gray-600 text-xs">
                      <span>Subtotal</span>
                      <span className="font-semibold">₹{getSubtotal().toFixed(2)}</span>
                    </div>
                    
                    {discount && (
                      <div className="flex justify-between text-green-600 text-xs">
                        <span>Discount ({discount.description})</span>
                        <span className="font-semibold">-₹{getDiscountAmount().toFixed(2)}</span>
                      </div>
                    )}
                    
                    {includeTax && (
                      <div className="flex justify-between text-gray-600 text-xs">
                        <span>Tax (18%)</span>
                        <span className="font-semibold">₹{getTaxAmount().toFixed(2)}</span>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-bold text-gray-900 p-2 bg-gray-50 rounded-lg">
                      <span>Total</span>
                      <span>₹{getTotalAmount().toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Enhanced Payment Buttons */}
                  <div className="p-3 space-y-2 border-t bg-gray-50">
                    <div className="grid grid-cols-2 gap-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`flex items-center gap-1 border-${themeColors.text.split('-')[1]}-200 ${themeColors.text} hover:bg-${themeColors.text.split('-')[1]}-50 h-8 text-xs font-semibold rounded-lg`}
                        onClick={handleCashPayment}
                      >
                        <Banknote className="h-3 w-3" />
                        Cash
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1 border-blue-200 text-blue-600 hover:bg-blue-50 h-8 text-xs font-semibold rounded-lg"
                        onClick={handleUPIPayment}
                      >
                        <Smartphone className="h-3 w-3" />
                        UPI
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1 border-purple-200 text-purple-600 hover:bg-purple-50 h-8 text-xs font-semibold rounded-lg"
                        onClick={handleCreditPayment}
                      >
                        <UserCheck className="h-3 w-3" />
                        Credit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50 h-8 text-xs font-semibold rounded-lg"
                        onClick={handleSplitPayment}
                      >
                        <Split className="h-3 w-3" />
                        Split
                      </Button>
                    </div>
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 h-10 text-sm font-bold shadow-lg rounded-lg"
                      onClick={handleCardPayment}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Complete Card Payment
                    </Button>
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

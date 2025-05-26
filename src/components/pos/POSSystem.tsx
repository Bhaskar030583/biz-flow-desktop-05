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
  Palette
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
    setShowCashModal(true);
  };

  const handleSplitPayment = () => {
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

  const handleUPIPayment = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

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
    setShowCreditModal(true);
  };

  const handlePaymentComplete = () => {
    setCart([]);
    setDiscount(null);
    setShowCashModal(false);
    setShowCreditModal(false);
    setShowSplitModal(false);
  };

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];

  // Filter products by search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Grid configuration
  const getGridCols = () => {
    switch (gridSize) {
      case 'small': return 'grid-cols-6';
      case 'medium': return 'grid-cols-4';
      case 'large': return 'grid-cols-3';
      default: return 'grid-cols-4';
    }
  };

  const getCardSize = () => {
    switch (gridSize) {
      case 'small': return { cardClass: 'h-24', iconSize: 'h-8 w-8', titleSize: 'text-xs', priceSize: 'text-sm' };
      case 'medium': return { cardClass: 'h-32', iconSize: 'h-10 w-10', titleSize: 'text-sm', priceSize: 'text-base' };
      case 'large': return { cardClass: 'h-40', iconSize: 'h-12 w-12', titleSize: 'text-base', priceSize: 'text-lg' };
      default: return { cardClass: 'h-32', iconSize: 'h-10 w-10', titleSize: 'text-sm', priceSize: 'text-base' };
    }
  };

  const cardConfig = getCardSize();

  const handleExit = () => {
    if (cart.length > 0) {
      const confirmed = window.confirm("You have items in your cart. Are you sure you want to exit?");
      if (!confirmed) return;
    }
    
    // If this is a popup window, close it
    if (window.opener) {
      window.close();
    } else {
      // Navigate back to main application
      window.location.href = '/';
    }
  };

  // Apply theme to the document when component mounts or theme changes
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

  // Get theme-specific colors
  const getThemeColors = () => {
    switch (colorTheme) {
      case 'professional':
        return {
          gradient: 'from-gray-600 to-gray-800',
          hover: 'hover:from-gray-700 hover:to-gray-900',
          accent: 'bg-gray-600 hover:bg-gray-700'
        };
      case 'modern':
        return {
          gradient: 'from-purple-500 to-purple-700',
          hover: 'hover:from-purple-600 hover:to-purple-800',
          accent: 'bg-purple-600 hover:bg-purple-700'
        };
      case 'vibrant':
        return {
          gradient: 'from-green-500 to-green-700',
          hover: 'hover:from-green-600 hover:to-green-800',
          accent: 'bg-green-600 hover:bg-green-700'
        };
      default:
        return {
          gradient: 'from-orange-500 to-red-500',
          hover: 'hover:from-orange-600 hover:to-red-600',
          accent: 'bg-orange-500 hover:bg-orange-600'
        };
    }
  };

  const themeColors = getThemeColors();

  return (
    <div className="flex h-screen bg-gray-50" data-color-theme={colorTheme}>
      {/* Left Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col border-r">
        {/* Logo Section with Exit and Theme buttons */}
        <div className={`p-6 border-b bg-gradient-to-r ${themeColors.gradient}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                <img 
                  src="/lovable-uploads/528f105b-5de5-4806-a64a-99582022753b.png" 
                  alt="ABC Cafe Logo" 
                  className="w-10 h-10 rounded-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">ABC CAFE</h2>
              </div>
            </div>
            
            {/* Control buttons */}
            <div className="flex gap-2">
              {/* Theme Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  >
                    <Palette className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-xl z-50">
                  {themeOptions.map((theme) => (
                    <DropdownMenuItem
                      key={theme.value}
                      onClick={() => setColorTheme(theme.value as any)}
                      className={`cursor-pointer ${colorTheme === theme.value ? 'bg-gray-100' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${theme.color}`} />
                        <span>{theme.label}</span>
                        {colorTheme === theme.value && <span className="ml-auto">✓</span>}
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
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                title="Exit POS"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            {categories.map(category => {
              const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || LayoutGrid;
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 h-12 text-left ${
                    selectedCategory === category 
                      ? `bg-gradient-to-r ${themeColors.gradient} text-white ${themeColors.hover} shadow-md` 
                      : `text-gray-700 hover:bg-gray-50 hover:text-${colorTheme === 'professional' ? 'gray' : colorTheme === 'modern' ? 'purple' : colorTheme === 'vibrant' ? 'green' : 'orange'}-600`
                  }`}
                  onClick={() => setSelectedCategory(category)}
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

        {/* Store Info */}
        {storeInfo && (
          <div className="p-4 border-t bg-gray-50">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-gray-800">{storeInfo.storeName}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-green-600" />
                <span className="text-gray-600">{storeInfo.salespersonName}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Products Section */}
        <div className="flex-1 p-4 overflow-hidden">
          {/* Header with Search and Grid Controls */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {/* Grid Size Controls */}
                <div className="flex items-center gap-2 bg-white rounded-lg p-1 border">
                  <Button
                    variant={gridSize === 'small' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGridSize('small')}
                    className={gridSize === 'small' ? `${themeColors.accent}` : ''}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={gridSize === 'medium' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGridSize('medium')}
                    className={gridSize === 'medium' ? `${themeColors.accent}` : ''}
                  >
                    <Grid2X2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={gridSize === 'large' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGridSize('large')}
                    className={gridSize === 'large' ? `${themeColors.accent}` : ''}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 h-10 text-base border-gray-200 focus:border-${colorTheme === 'professional' ? 'gray' : colorTheme === 'modern' ? 'purple' : colorTheme === 'vibrant' ? 'green' : 'orange'}-300 focus:ring-${colorTheme === 'professional' ? 'gray' : colorTheme === 'modern' ? 'purple' : colorTheme === 'vibrant' ? 'green' : 'orange'}-200`}
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className={`grid ${getGridCols()} gap-3 overflow-y-auto h-[calc(100vh-180px)]`}>
            {filteredProducts.map(product => (
              <Card
                key={product.id}
                className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-${colorTheme === 'professional' ? 'gray' : colorTheme === 'modern' ? 'purple' : colorTheme === 'vibrant' ? 'green' : 'orange'}-300 hover:scale-102 bg-white ${cardConfig.cardClass}`}
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-2">
                  <div className={`aspect-square bg-gradient-to-br from-${colorTheme === 'professional' ? 'gray' : colorTheme === 'modern' ? 'purple' : colorTheme === 'vibrant' ? 'green' : 'orange'}-100 to-${colorTheme === 'professional' ? 'gray' : colorTheme === 'modern' ? 'purple' : colorTheme === 'vibrant' ? 'green' : 'red'}-100 rounded-lg mb-2 flex items-center justify-center`}>
                    <UtensilsCrossed className={`${cardConfig.iconSize} text-${colorTheme === 'professional' ? 'gray' : colorTheme === 'modern' ? 'purple' : colorTheme === 'vibrant' ? 'green' : 'orange'}-500`} />
                  </div>
                  
                  <h3 className={`font-semibold text-gray-800 ${cardConfig.titleSize} mb-1 line-clamp-2 min-h-[2rem]`}>
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-gray-900 ${cardConfig.priceSize}`}>
                      ₹{product.price}
                    </span>
                    <Button
                      size="sm"
                      className={`bg-gradient-to-r ${themeColors.gradient} ${themeColors.hover} text-white h-6 w-6 p-0 shadow-md`}
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
            ))}
          </div>
        </div>

        {/* Order Summary Section - Compact design */}
        <div className="w-72 bg-white shadow-lg border-l">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className={`p-4 border-b bg-gradient-to-r ${themeColors.gradient}`}>
              <div className="flex items-center justify-between text-white">
                <h2 className="text-lg font-bold">Current Order</h2>
                <Badge variant="secondary" className={`bg-white text-${colorTheme === 'professional' ? 'gray' : colorTheme === 'modern' ? 'purple' : colorTheme === 'vibrant' ? 'green' : 'orange'}-600 font-semibold text-xs`}>
                  {cart.length} items
                </Badge>
              </div>
            </div>

            {/* Cart Items - Compact line-item design */}
            <div className="flex-1 p-3 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-base font-medium">No items in cart</p>
                  <p className="text-xs">Add items to get started</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {cart.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between py-2 px-2 bg-gray-50 rounded border hover:bg-gray-100">
                      {/* Left side: Number, Name, Price */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className={`text-xs font-bold text-${colorTheme === 'professional' ? 'gray' : colorTheme === 'modern' ? 'purple' : colorTheme === 'vibrant' ? 'green' : 'orange'}-600 border-${colorTheme === 'professional' ? 'gray' : colorTheme === 'modern' ? 'purple' : colorTheme === 'vibrant' ? 'green' : 'orange'}-200 px-1 py-0 flex-shrink-0`}>
                            #{index + 1}
                          </Badge>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-gray-800 text-xs truncate">{item.name}</h4>
                            <p className="text-xs text-gray-500">₹{item.price}</p>
                          </div>
                        </div>
                      </div>

                      {/* Center: Quantity input */}
                      <div className="flex items-center gap-1 mx-2">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value) || 1;
                            updateQuantity(item.id, newQuantity);
                          }}
                          className={`w-12 h-6 text-xs text-center p-1 border-${colorTheme === 'professional' ? 'gray' : colorTheme === 'modern' ? 'purple' : colorTheme === 'vibrant' ? 'green' : 'orange'}-200`}
                          min="1"
                        />
                      </div>

                      {/* Right side: Total and Delete */}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-xs min-w-[50px] text-right">₹{item.total}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(item.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <>
                {/* Discount Section */}
                <div className="p-3 border-t bg-gray-50">
                  {!discount && !showDiscountInput && (
                    <Button
                      variant="outline"
                      className={`w-full flex items-center gap-2 border-${colorTheme === 'professional' ? 'gray' : colorTheme === 'modern' ? 'purple' : colorTheme === 'vibrant' ? 'green' : 'orange'}-200 text-${colorTheme === 'professional' ? 'gray' : colorTheme === 'modern' ? 'purple' : colorTheme === 'vibrant' ? 'green' : 'orange'}-600 hover:bg-${colorTheme === 'professional' ? 'gray' : colorTheme === 'modern' ? 'purple' : colorTheme === 'vibrant' ? 'green' : 'orange'}-50 h-8 text-xs`}
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
                          className={discountType === 'percentage' ? `${themeColors.accent} h-7 px-2` : 'h-7 px-2'}
                        >
                          <Percent className="h-3 w-3" />
                        </Button>
                        <Button
                          variant={discountType === 'value' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setDiscountType('value')}
                          className={discountType === 'value' ? `${themeColors.accent} h-7 px-2` : 'h-7 px-2'}
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
                          className="flex-1 h-7 text-xs"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              applyDiscount();
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={applyDiscount}
                          className="bg-green-600 hover:bg-green-700 h-7 px-2 text-xs"
                        >
                          Apply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowDiscountInput(false)}
                          className="h-7 px-1"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {discount && (
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                      <div className="flex items-center gap-2">
                        <Percent className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-medium text-green-800">{discount.description}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={removeDiscount}
                        className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Tax Toggle */}
                <div className="p-3 border-t bg-gray-50">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tax-toggle" className="text-xs font-medium">
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
                
                {/* Order Summary */}
                <div className="p-3 space-y-2 bg-white">
                  <div className="flex justify-between text-gray-600 text-xs">
                    <span>Subtotal</span>
                    <span>₹{getSubtotal().toFixed(2)}</span>
                  </div>
                  
                  {discount && (
                    <div className="flex justify-between text-green-600 text-xs">
                      <span>Discount ({discount.description})</span>
                      <span>-₹{getDiscountAmount().toFixed(2)}</span>
                    </div>
                  )}
                  
                  {includeTax && (
                    <div className="flex justify-between text-gray-600 text-xs">
                      <span>Tax (18%)</span>
                      <span>₹{getTaxAmount().toFixed(2)}</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Payable Amount</span>
                    <span>₹{getTotalAmount().toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-3 space-y-2 border-t bg-gray-50">
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={`flex items-center gap-2 border-${colorTheme === 'professional' ? 'gray' : colorTheme === 'modern' ? 'purple' : colorTheme === 'vibrant' ? 'green' : 'orange'}-200 text-${colorTheme === 'professional' ? 'gray' : colorTheme === 'modern' ? 'purple' : colorTheme === 'vibrant' ? 'green' : 'orange'}-600 hover:bg-${colorTheme === 'professional' ? 'gray' : colorTheme === 'modern' ? 'purple' : colorTheme === 'vibrant' ? 'green' : 'orange'}-50 h-8 text-xs`}
                      onClick={handleCashPayment}
                    >
                      <Banknote className="h-3 w-3" />
                      Cash
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 h-8 text-xs"
                      onClick={handleUPIPayment}
                    >
                      <Smartphone className="h-3 w-3" />
                      UPI
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-2 border-purple-200 text-purple-600 hover:bg-purple-50 h-8 text-xs"
                      onClick={handleCreditPayment}
                    >
                      <UserCheck className="h-3 w-3" />
                      Credit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 h-8 text-xs"
                      onClick={handleSplitPayment}
                    >
                      <Split className="h-3 w-3" />
                      Split
                    </Button>
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 h-10 text-sm font-semibold shadow-lg"
                    onClick={handleCardPayment}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Card Payment
                  </Button>
                </div>
              </>
            )}
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

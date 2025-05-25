import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  Banknote,
  Smartphone,
  Calculator,
  Grid3X3,
  Search,
  Grid2X2,
  LayoutGrid,
  Users,
  UserCheck,
  Receipt
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { CashPaymentModal } from "./CashPaymentModal";
import { CustomerManagement } from "./CustomerManagement";
import { CreditPaymentModal } from "./CreditPaymentModal";
import { BillHistory } from "./BillHistory";
import { generateBill } from "@/services/billService";
import { toast } from "sonner";

interface POSItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface POSSystemProps {
  products?: Array<{
    id: string;
    name: string;
    price: number;
    category: string;
    quantity?: number;
  }>;
}

export const POSSystem: React.FC<POSSystemProps> = ({ products = [] }) => {
  const [cart, setCart] = useState<POSItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [gridColumns, setGridColumns] = useState(3);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const isMobile = useIsMobile();

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

  const updateQuantity = (id: string, change: number) => {
    setCart(prev => 
      prev.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(0, item.quantity + change);
          return newQuantity === 0 
            ? null 
            : { ...item, quantity: newQuantity, total: newQuantity * item.price };
        }
        return item;
      }).filter(Boolean) as POSItem[]
    );
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const handleCashPayment = () => {
    setShowCashModal(true);
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
        cartItems: cart
      });

      toast.success("Card payment completed and bill generated!");
      setCart([]);
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
        cartItems: cart
      });

      toast.success("UPI payment completed and bill generated!");
      setCart([]);
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
    setShowCashModal(false);
    setShowCreditModal(false);
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

  // Grid view options
  const gridViewOptions = [
    { columns: 2, icon: Grid2X2, label: '2 columns' },
    { columns: 3, icon: Grid3X3, label: '3 columns' },
    { columns: 4, icon: LayoutGrid, label: '4 columns' },
    { columns: 5, icon: LayoutGrid, label: '5 columns' },
    { columns: 6, icon: LayoutGrid, label: '6 columns' }
  ];

  // Dynamic grid class based on selected columns - Fixed version
  const getGridClass = () => {
    if (isMobile) return 'grid-cols-1 sm:grid-cols-2';
    
    const gridClasses = {
      2: 'grid-cols-2',
      3: 'grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      5: 'grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
      6: 'grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
    };
    
    return gridClasses[gridColumns as keyof typeof gridClasses] || 'grid-cols-2 lg:grid-cols-3';
  };

  return (
    <>
      <div className={`grid gap-4 h-full ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'}`}>
        {/* Main Content Section */}
        <div className={`space-y-4 ${isMobile ? 'order-2' : 'lg:col-span-3'}`}>
          <Tabs defaultValue="pos" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pos" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                POS System
              </TabsTrigger>
              <TabsTrigger value="customers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Customers
              </TabsTrigger>
              <TabsTrigger value="bills" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Bill History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pos" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Grid3X3 className="h-5 w-5" />
                    Products
                  </CardTitle>
                  
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {categories.map(category => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className="text-xs"
                      >
                        {category === "all" ? "All Categories" : category}
                      </Button>
                    ))}
                  </div>

                  {/* Grid View Controls */}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-sm text-muted-foreground mr-2">Grid View:</span>
                    <div className="flex flex-wrap gap-1">
                      {gridViewOptions.map(({ columns, icon: Icon, label }) => (
                        <Button
                          key={columns}
                          variant={gridColumns === columns ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            console.log(`Grid columns changed to: ${columns}`);
                            setGridColumns(columns);
                          }}
                          className="flex items-center gap-1"
                          title={label}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="hidden sm:inline text-xs">{columns}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Debug info - remove after testing */}
                  <div className="text-xs text-gray-500">
                    Current grid: {gridColumns} columns | Class: {getGridClass()}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Grid3X3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No products found</p>
                        <p className="text-sm">Try adjusting your search or category filter</p>
                      </div>
                    ) : (
                      <div className={`grid gap-3 ${getGridClass()}`} key={gridColumns}>
                        {filteredProducts.map(product => (
                          <Card
                            key={product.id}
                            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-green-200"
                            onClick={() => addToCart(product)}
                          >
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                  <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                                  <Badge variant="outline" className="text-xs ml-2 shrink-0">
                                    {product.category}
                                  </Badge>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                  <div className="text-green-600 font-bold text-lg">
                                    ₹{product.price}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-green-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addToCart(product);
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                {/* Stock quantity display */}
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-500">Stock:</span>
                                  <span className={`font-medium ${
                                    (product.quantity || 0) <= 10 
                                      ? 'text-red-600' 
                                      : (product.quantity || 0) <= 50 
                                        ? 'text-orange-600' 
                                        : 'text-green-600'
                                  }`}>
                                    {product.quantity || 0} units
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers" className="mt-4">
              <CustomerManagement />
            </TabsContent>

            <TabsContent value="bills" className="mt-4">
              <BillHistory />
            </TabsContent>
          </Tabs>
        </div>

        {/* Cart Section */}
        <div className={`space-y-4 ${isMobile ? 'order-1' : ''}`}>
          <Card className="h-fit">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Cart ({cart.length})
                </span>
                <Badge variant="secondary" className="text-sm">
                  ₹{getTotalAmount().toFixed(2)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {/* Cart Items */}
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Cart is empty</p>
                    <p className="text-xs">Add products to get started</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 border rounded text-xs">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.name}</div>
                        <div className="text-gray-500">₹{item.price} each</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="h-5 w-5 p-0"
                        >
                          <Minus className="h-2 w-2" />
                        </Button>
                        <span className="w-6 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="h-5 w-5 p-0"
                        >
                          <Plus className="h-2 w-2" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFromCart(item.id)}
                          className="h-5 w-5 p-0 ml-1"
                        >
                          <Trash2 className="h-2 w-2" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <>
                  <Separator />
                  {/* Payment Methods */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Payment Method</div>
                    <div className="grid grid-cols-2 gap-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1 text-xs p-2"
                        onClick={handleCashPayment}
                      >
                        <Banknote className="h-3 w-3" />
                        Cash
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1 text-xs p-2"
                        onClick={handleCardPayment}
                      >
                        <CreditCard className="h-3 w-3" />
                        Card
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1 text-xs p-2"
                        onClick={handleUPIPayment}
                      >
                        <Smartphone className="h-3 w-3" />
                        UPI
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1 text-xs p-2"
                        onClick={handleCreditPayment}
                      >
                        <UserCheck className="h-3 w-3" />
                        Credit
                      </Button>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-sm py-2">
                    Complete Sale - ₹{getTotalAmount().toFixed(2)}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CashPaymentModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
        totalAmount={getTotalAmount()}
        onPaymentComplete={handlePaymentComplete}
      />

      <CreditPaymentModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        totalAmount={getTotalAmount()}
        cartItems={cart}
        onPaymentComplete={handlePaymentComplete}
      />
    </>
  );
};

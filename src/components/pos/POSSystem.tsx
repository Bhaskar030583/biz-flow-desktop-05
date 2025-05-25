
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  Banknote,
  Smartphone,
  Calculator
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  }>;
}

export const POSSystem: React.FC<POSSystemProps> = ({ products = [] }) => {
  const [cart, setCart] = useState<POSItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedProducts = filteredProducts.reduce((groups, product) => {
    const category = product.category || "Other";
    if (!groups[category]) groups[category] = [];
    groups[category].push(product);
    return groups;
  }, {} as Record<string, typeof products>);

  return (
    <div className={`grid gap-4 h-full ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
      {/* Products Section */}
      <div className={`space-y-4 ${isMobile ? 'order-2' : 'lg:col-span-2'}`}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Products
            </CardTitle>
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-2"
            />
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                <div key={category}>
                  <Badge variant="outline" className="mb-2">
                    {category}
                  </Badge>
                  <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 xl:grid-cols-3'}`}>
                    {categoryProducts.map(product => (
                      <Button
                        key={product.id}
                        variant="outline"
                        className="p-3 h-auto text-left justify-start"
                        onClick={() => addToCart(product)}
                      >
                        <div className="w-full">
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-green-600 font-bold">₹{product.price}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart Section */}
      <div className={`space-y-4 ${isMobile ? 'order-1' : ''}`}>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Cart ({cart.length})
              </span>
              <Badge variant="secondary">
                ₹{getTotalAmount().toFixed(2)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cart Items */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.name}</div>
                    <div className="text-xs text-gray-500">₹{item.price} each</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="h-6 w-6 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="h-6 w-6 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeFromCart(item.id)}
                      className="h-6 w-6 p-0 ml-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <>
                <Separator />
                {/* Payment Methods */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Payment Method</div>
                  <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Banknote className="h-4 w-4" />
                      Cash
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <CreditCard className="h-4 w-4" />
                      Card
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Smartphone className="h-4 w-4" />
                      UPI
                    </Button>
                  </div>
                </div>
                
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Complete Sale - ₹{getTotalAmount().toFixed(2)}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

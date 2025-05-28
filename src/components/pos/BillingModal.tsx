
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Minus, Plus, ShoppingCart, Trash2, Calculator, CreditCard, Banknote, SplitSquareHorizontal, Clock, Smartphone, X, Percent } from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateQuantity: (productId: string, newQuantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  handleCashPayment: () => void;
  handleUPIPayment: () => void;
  handleCreditPayment: () => void;
  handleSplitPayment: () => void;
  handlePendingPayment: () => void;
}

export const BillingModal: React.FC<BillingModalProps> = ({
  isOpen,
  onClose,
  cart,
  updateQuantity,
  removeFromCart,
  clearCart,
  getTotalAmount,
  handleCashPayment,
  handleUPIPayment,
  handleCreditPayment,
  handleSplitPayment,
  handlePendingPayment
}) => {
  const [discountType, setDiscountType] = useState<'percentage' | 'value'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);

  const subtotal = getTotalAmount();
  
  const calculateDiscount = () => {
    if (discountType === 'percentage') {
      return (subtotal * discountValue) / 100;
    }
    return Math.min(discountValue, subtotal); // Ensure discount doesn't exceed subtotal
  };

  const discountAmount = calculateDiscount();
  const finalTotal = subtotal - discountAmount;

  const resetDiscount = () => {
    setDiscountValue(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xs sm:max-w-sm md:max-w-md max-h-[85vh] overflow-y-auto mx-2">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center justify-between text-sm md:text-base">
            <span className="flex items-center gap-2 text-blue-900 font-semibold">
              <Calculator className="h-4 w-4 md:h-5 md:w-5" />
              Cart ({cart.length})
            </span>
            <div className="flex gap-1">
              {cart.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 px-2 py-1 h-7 text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-7 w-7 p-0 hover:bg-gray-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold mb-1">Your cart is empty</h3>
              <p className="text-xs text-gray-400">Add products to get started</p>
            </div>
          ) : (
            <>
              {/* Cart Items - Compact Version */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="flex-1 pr-2 min-w-0">
                        <h4 className="font-medium text-xs text-gray-800 truncate">{item.name}</h4>
                        <p className="text-xs text-gray-600">₹{Number(item.price).toFixed(2)} each</p>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0 border-blue-200"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-semibold text-xs min-w-[20px] text-center bg-white px-2 py-1 rounded border text-gray-800">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0 border-blue-200"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        
                        <div className="text-right ml-2">
                          <p className="font-bold text-green-700 text-xs bg-green-100 px-2 py-1 rounded">
                            ₹{Number(item.total).toFixed(2)}
                          </p>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6 ml-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-2" />

              {/* Discount Section */}
              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-4 w-4 text-yellow-600" />
                  <Label className="text-sm font-medium text-yellow-800">Discount</Label>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Select value={discountType} onValueChange={(value) => setDiscountType(value as 'percentage' | 'value')}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="value">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      placeholder={discountType === 'percentage' ? '0' : '0.00'}
                      value={discountValue || ''}
                      onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                      className="h-8 text-xs"
                      min="0"
                      max={discountType === 'percentage' ? 100 : subtotal}
                      step={discountType === 'percentage' ? 1 : 0.01}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetDiscount}
                      className="h-8 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                
                {discountAmount > 0 && (
                  <div className="text-xs text-yellow-700">
                    Discount: -{discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue.toFixed(2)}`} = ₹{discountAmount.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Billing Summary */}
              <div className="bg-green-50 rounded-lg p-3 border border-green-200 space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-red-600">Discount:</span>
                    <span className="font-medium text-red-600">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-gray-800">Total:</span>
                  <span className="text-green-700">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Buttons - Compact Grid */}
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-xs h-10" 
                  onClick={handleCashPayment}
                  disabled={cart.length === 0}
                >
                  <Banknote className="h-3 w-3 mr-1" />
                  Cash
                </Button>
                
                <Button 
                  className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-xs h-10" 
                  onClick={handleUPIPayment}
                  disabled={cart.length === 0}
                >
                  <Smartphone className="h-3 w-3 mr-1" />
                  UPI
                </Button>
                
                <Button 
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-xs h-10" 
                  onClick={handleCreditPayment}
                  disabled={cart.length === 0}
                >
                  <CreditCard className="h-3 w-3 mr-1" />
                  Credit
                </Button>
                
                <Button 
                  className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-xs h-10" 
                  onClick={handleSplitPayment}
                  disabled={cart.length === 0}
                >
                  <SplitSquareHorizontal className="h-3 w-3 mr-1" />
                  Split
                </Button>
                
                <Button 
                  className="col-span-2 bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-xs h-10" 
                  onClick={handlePendingPayment}
                  disabled={cart.length === 0}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Save as Pending
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

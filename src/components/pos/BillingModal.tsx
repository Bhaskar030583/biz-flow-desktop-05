
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
    return Math.min(discountValue, subtotal);
  };

  const discountAmount = calculateDiscount();
  const finalTotal = subtotal - discountAmount;

  const resetDiscount = () => {
    setDiscountValue(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xs sm:max-w-sm md:max-w-lg lg:max-w-xl max-h-[90vh] overflow-y-auto mx-2 rounded-xl">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center justify-between text-base md:text-lg">
            <span className="flex items-center gap-2 text-blue-900 font-bold">
              <Calculator className="h-5 w-5 md:h-6 md:w-6" />
              Shopping Cart ({cart.length})
            </span>
            <div className="flex gap-2">
              {cart.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 px-3 py-1 h-8 text-xs rounded-lg"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Your cart is empty</h3>
              <p className="text-sm text-gray-400">Add products to get started</p>
            </div>
          ) : (
            <>
              {/* Enhanced Cart Items */}
              <div className="space-y-3 max-h-48 md:max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-3 md:p-4 border border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="flex-1 pr-3 min-w-0">
                        <h4 className="font-semibold text-sm md:text-base text-gray-800 truncate">{item.name}</h4>
                        <p className="text-xs md:text-sm text-gray-600">₹{Number(item.price).toFixed(2)} each</p>
                      </div>
                      
                      <div className="flex items-center gap-2 md:gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 md:h-8 md:w-8 p-0 border-blue-200 hover:bg-blue-50 rounded-lg"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                        <span className="font-bold text-sm md:text-base min-w-[24px] md:min-w-[32px] text-center bg-white px-2 md:px-3 py-1 rounded-lg border text-gray-800">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 md:h-8 md:w-8 p-0 border-blue-200 hover:bg-blue-50 rounded-lg"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                        
                        <div className="text-right ml-2 md:ml-3">
                          <p className="font-bold text-green-700 text-sm md:text-base bg-green-100 px-2 md:px-3 py-1 rounded-lg">
                            ₹{Number(item.total).toFixed(2)}
                          </p>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-7 w-7 md:h-8 md:w-8 ml-1 rounded-lg"
                        >
                          <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Enhanced Discount Section */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                <div className="flex items-center gap-2 mb-3">
                  <Percent className="h-5 w-5 text-yellow-600" />
                  <Label className="text-sm md:text-base font-semibold text-yellow-800">Apply Discount</Label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <Select value={discountType} onValueChange={(value) => setDiscountType(value as 'percentage' | 'value')}>
                    <SelectTrigger className="h-9 md:h-10 text-sm md:text-base rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="value">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={discountType === 'percentage' ? '0' : '0.00'}
                      value={discountValue || ''}
                      onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                      className="h-9 md:h-10 text-sm md:text-base rounded-lg"
                      min="0"
                      max={discountType === 'percentage' ? 100 : subtotal}
                      step={discountType === 'percentage' ? 1 : 0.01}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetDiscount}
                      className="h-9 md:h-10 px-3 text-sm md:text-base rounded-lg"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                
                {discountAmount > 0 && (
                  <div className="text-sm md:text-base text-yellow-700 font-medium">
                    Discount Applied: -{discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue.toFixed(2)}`} = ₹{discountAmount.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Enhanced Billing Summary */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 space-y-2">
                <div className="flex justify-between items-center text-sm md:text-base">
                  <span className="text-gray-700 font-medium">Subtotal:</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-sm md:text-base">
                    <span className="text-red-600 font-medium">Discount:</span>
                    <span className="font-semibold text-red-600">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between items-center text-xl md:text-2xl font-bold">
                  <span className="text-gray-800">Total:</span>
                  <span className="text-green-700">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Enhanced Payment Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                <Button 
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 md:py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm md:text-base h-12 md:h-14 rounded-xl" 
                  onClick={handleCashPayment}
                  disabled={cart.length === 0}
                >
                  <Banknote className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Cash Payment
                </Button>
                
                <Button 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 md:py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm md:text-base h-12 md:h-14 rounded-xl" 
                  onClick={handleUPIPayment}
                  disabled={cart.length === 0}
                >
                  <Smartphone className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  UPI Payment
                </Button>
                
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 md:py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm md:text-base h-12 md:h-14 rounded-xl" 
                  onClick={handleCreditPayment}
                  disabled={cart.length === 0}
                >
                  <CreditCard className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Credit Sale
                </Button>
                
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 md:py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm md:text-base h-12 md:h-14 rounded-xl" 
                  onClick={handleSplitPayment}
                  disabled={cart.length === 0}
                >
                  <SplitSquareHorizontal className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Split Payment
                </Button>
                
                <Button 
                  className="col-span-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-3 md:py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm md:text-base h-12 md:h-14 rounded-xl" 
                  onClick={handlePendingPayment}
                  disabled={cart.length === 0}
                >
                  <Clock className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Save as Pending Payment
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

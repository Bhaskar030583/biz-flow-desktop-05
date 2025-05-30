
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
      <DialogContent className="max-w-sm mx-2 max-h-[90vh] overflow-y-auto rounded-2xl bg-white/95 backdrop-blur-sm border border-slate-200 shadow-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2 text-slate-800 font-bold">
              <Calculator className="h-6 w-6 text-blue-600" />
              Order Summary ({cart.length})
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
                  Clear
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-50 rounded-full flex items-center justify-center shadow-sm">
                <ShoppingCart className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-slate-700">Your cart is empty</h3>
              <p className="text-sm text-slate-400">Add products to get started</p>
            </div>
          ) : (
            <>
              {/* Professional Cart Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200/50 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div className="flex-1 pr-3 min-w-0">
                        <h4 className="font-semibold text-sm text-slate-800 truncate">{item.name}</h4>
                        <p className="text-xs text-slate-600">₹{Number(item.price).toFixed(2)} each</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 border-slate-200 hover:bg-blue-50 rounded-lg"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-bold text-sm min-w-[28px] text-center bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-800">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 border-slate-200 hover:bg-blue-50 rounded-lg"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        
                        <div className="text-right ml-2">
                          <p className="font-bold text-green-700 text-sm bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                            ₹{Number(item.total).toFixed(2)}
                          </p>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8 ml-1 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4 bg-slate-200" />

              {/* Professional Discount Section */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200/50">
                <div className="flex items-center gap-2 mb-3">
                  <Percent className="h-5 w-5 text-amber-600" />
                  <Label className="text-sm font-semibold text-amber-800">Apply Discount</Label>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Select value={discountType} onValueChange={(value) => setDiscountType(value as 'percentage' | 'value')}>
                    <SelectTrigger className="h-10 text-sm rounded-lg border-amber-200">
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
                      className="h-10 text-sm rounded-lg border-amber-200"
                      min="0"
                      max={discountType === 'percentage' ? 100 : subtotal}
                      step={discountType === 'percentage' ? 1 : 0.01}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetDiscount}
                      className="h-10 px-3 text-sm rounded-lg border-amber-200"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                
                {discountAmount > 0 && (
                  <div className="text-sm text-amber-700 font-medium">
                    Discount Applied: -{discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue.toFixed(2)}`} = ₹{discountAmount.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Professional Billing Summary */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200/50 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-700 font-medium">Subtotal:</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-red-600 font-medium">Discount:</span>
                    <span className="font-semibold text-red-600">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="my-2 bg-green-200" />
                <div className="flex justify-between items-center text-xl font-bold">
                  <span className="text-slate-800">Total:</span>
                  <span className="text-green-700">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Professional Payment Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm h-14 rounded-xl" 
                  onClick={handleCashPayment}
                  disabled={cart.length === 0}
                >
                  <Banknote className="h-5 w-5 mr-2" />
                  Cash Payment
                </Button>
                
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm h-14 rounded-xl" 
                  onClick={handleUPIPayment}
                  disabled={cart.length === 0}
                >
                  <Smartphone className="h-5 w-5 mr-2" />
                  UPI Payment
                </Button>
                
                <Button 
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm h-14 rounded-xl" 
                  onClick={handleCreditPayment}
                  disabled={cart.length === 0}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Credit Sale
                </Button>
                
                <Button 
                  className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm h-14 rounded-xl" 
                  onClick={handleSplitPayment}
                  disabled={cart.length === 0}
                >
                  <SplitSquareHorizontal className="h-5 w-5 mr-2" />
                  Split Payment
                </Button>
                
                <Button 
                  className="col-span-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm h-14 rounded-xl" 
                  onClick={handlePendingPayment}
                  disabled={cart.length === 0}
                >
                  <Clock className="h-5 w-5 mr-2" />
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

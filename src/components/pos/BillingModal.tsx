
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, ShoppingCart, Trash2, Calculator, CreditCard, Banknote, SplitSquareHorizontal, Clock, Smartphone, X } from "lucide-react";

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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[95vh] overflow-y-auto mx-2">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-blue-900 font-semibold text-sm md:text-base">
              <Calculator className="h-4 w-4 md:h-5 md:w-5" />
              Cart ({cart.length})
            </span>
            <div className="flex gap-1 md:gap-2">
              {cart.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 px-2 py-1 h-7 md:h-8 text-xs md:text-sm"
                >
                  <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  Clear
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-6 w-6 md:h-8 md:w-8 p-0"
              >
                <X className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 md:space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 md:py-12 text-gray-500">
              <ShoppingCart className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 opacity-30" />
              <p className="text-base md:text-lg font-medium">Cart is empty</p>
              <p className="text-xs md:text-sm">Add products to get started</p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-2 md:space-y-3 max-h-48 md:max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg md:rounded-xl p-2 md:p-4 shadow-sm border border-blue-100">
                    <div className="flex justify-between items-start mb-2 md:mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-xs md:text-sm text-gray-800">{item.name}</h4>
                        <p className="text-xs text-gray-600">₹{Number(item.price).toFixed(2)} each</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6 md:h-auto md:w-auto"
                      >
                        <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 md:gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 md:h-8 md:w-8 p-0 border-blue-200 hover:bg-blue-50"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-2 w-2 md:h-3 md:w-3" />
                        </Button>
                        <span className="font-semibold text-xs md:text-sm min-w-[30px] md:min-w-[40px] text-center bg-white px-2 md:px-3 py-1 md:py-2 rounded border">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 md:h-8 md:w-8 p-0 border-blue-200 hover:bg-blue-50"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-2 w-2 md:h-3 md:w-3" />
                        </Button>
                      </div>
                      <p className="font-bold text-green-700 text-xs md:text-sm bg-green-100 px-2 md:px-3 py-1 md:py-2 rounded">
                        ₹{Number(item.total).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-3 md:my-4" />

              {/* Total */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg md:rounded-xl p-3 md:p-4 border border-green-200">
                <div className="flex justify-between items-center text-lg md:text-2xl font-bold">
                  <span className="text-gray-800">Total:</span>
                  <span className="text-green-700">₹{getTotalAmount().toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Buttons */}
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <Button 
                  className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 md:py-3 shadow-md transform hover:scale-105 transition-all duration-200 text-xs md:text-sm h-8 md:h-auto" 
                  onClick={handleCashPayment}
                  disabled={cart.length === 0}
                >
                  <Banknote className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  Cash
                </Button>
                
                <Button 
                  className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 md:py-3 shadow-md transform hover:scale-105 transition-all duration-200 text-xs md:text-sm h-8 md:h-auto" 
                  onClick={handleUPIPayment}
                  disabled={cart.length === 0}
                >
                  <Smartphone className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  UPI
                </Button>
                
                <Button 
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 md:py-3 shadow-md transform hover:scale-105 transition-all duration-200 text-xs md:text-sm h-8 md:h-auto" 
                  onClick={handleCreditPayment}
                  disabled={cart.length === 0}
                >
                  <CreditCard className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  Credit
                </Button>
                
                <Button 
                  className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 md:py-3 shadow-md transform hover:scale-105 transition-all duration-200 text-xs md:text-sm h-8 md:h-auto" 
                  onClick={handleSplitPayment}
                  disabled={cart.length === 0}
                >
                  <SplitSquareHorizontal className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  Split
                </Button>
                
                <Button 
                  className="col-span-2 bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 md:py-3 shadow-md transform hover:scale-105 transition-all duration-200 text-xs md:text-sm h-8 md:h-auto" 
                  onClick={handlePendingPayment}
                  disabled={cart.length === 0}
                >
                  <Clock className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  Pending Payment
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

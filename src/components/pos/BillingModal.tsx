
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
      <DialogContent className="max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-blue-900 font-semibold text-base md:text-lg">
              <Calculator className="h-5 w-5 md:h-6 md:w-6" />
              Shopping Cart ({cart.length})
            </span>
            <div className="flex gap-2">
              {cart.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 px-3 py-2 h-9 text-sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-9 w-9 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 md:space-y-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 md:py-16 text-gray-500">
              <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-10 w-10 md:h-12 md:w-12 text-gray-400" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">Your cart is empty</h3>
              <p className="text-sm md:text-base text-gray-400">Add some products to get started</p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-3 md:space-y-4 max-h-60 md:max-h-80 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 md:p-5 shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 pr-4">
                        <h4 className="font-semibold text-sm md:text-base text-gray-800 mb-1">{item.name}</h4>
                        <p className="text-xs md:text-sm text-gray-600">₹{Number(item.price).toFixed(2)} each</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 w-9 p-0 border-blue-200 hover:bg-blue-50"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-semibold text-sm md:text-base min-w-[50px] text-center bg-white px-4 py-2 rounded-lg border shadow-sm">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 w-9 p-0 border-blue-200 hover:bg-blue-50"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-700 text-sm md:text-base bg-green-100 px-3 py-2 rounded-lg">
                          ₹{Number(item.total).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4 md:my-6" />

              {/* Total */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 md:p-6 border border-green-200 shadow-sm">
                <div className="flex justify-between items-center text-xl md:text-3xl font-bold">
                  <span className="text-gray-800">Total Amount:</span>
                  <span className="text-green-700">₹{getTotalAmount().toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Buttons */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <Button 
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 md:py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm md:text-base h-12 md:h-14" 
                  onClick={handleCashPayment}
                  disabled={cart.length === 0}
                >
                  <Banknote className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Cash Payment
                </Button>
                
                <Button 
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 md:py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm md:text-base h-12 md:h-14" 
                  onClick={handleUPIPayment}
                  disabled={cart.length === 0}
                >
                  <Smartphone className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  UPI Payment
                </Button>
                
                <Button 
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 md:py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm md:text-base h-12 md:h-14" 
                  onClick={handleCreditPayment}
                  disabled={cart.length === 0}
                >
                  <CreditCard className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Credit Payment
                </Button>
                
                <Button 
                  className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 md:py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm md:text-base h-12 md:h-14" 
                  onClick={handleSplitPayment}
                  disabled={cart.length === 0}
                >
                  <SplitSquareHorizontal className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Split Payment
                </Button>
                
                <Button 
                  className="col-span-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 md:py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm md:text-base h-12 md:h-14" 
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

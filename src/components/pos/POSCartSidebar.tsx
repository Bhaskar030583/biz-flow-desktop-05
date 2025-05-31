
import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, ShoppingCart, Trash2, Banknote, Smartphone, CreditCard, SplitSquareHorizontal, Clock } from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface POSCartSidebarProps {
  cart: CartItem[];
  updateQuantity: (productId: string, newQuantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  onCashPayment: () => void;
  onUPIPayment: () => void;
  onCreditPayment: () => void;
  onSplitPayment: () => void;
  onPendingPayment: () => void;
}

export const POSCartSidebar: React.FC<POSCartSidebarProps> = ({
  cart,
  updateQuantity,
  removeFromCart,
  clearCart,
  getTotalAmount,
  onCashPayment,
  onUPIPayment,
  onCreditPayment,
  onSplitPayment,
  onPendingPayment,
}) => {
  return (
    <div className="w-96 bg-white/95 backdrop-blur-sm border-l border-slate-200 flex flex-col shadow-xl">
      {/* Cart Header */}
      <div className="p-6 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <h2 className="text-heading-h3 text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-bold">Order Summary</h2>
          {cart.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearCart}
              className="text-red-700 hover:text-white border-red-300 hover:bg-red-600 bg-red-50 text-button-sm font-semibold"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-50/50 to-white/50">
        {cart.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <div className="w-20 h-20 mx-auto mb-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
              <ShoppingCart className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-heading-h4 mb-3 text-slate-700">Your cart is empty</h3>
            <p className="text-body-md text-slate-500">Add products to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 pr-4">
                    <h4 className="text-label-md text-slate-800">{item.name}</h4>
                    <p className="text-body-xs text-slate-500 mt-1">₹{Number(item.price).toFixed(2)} each</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-600 hover:text-white hover:bg-red-600 p-2 h-8 w-8 border border-red-200 rounded-md"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 p-0 border-orange-300 hover:border-orange-500 hover:bg-orange-100 text-orange-600 hover:text-orange-700 font-bold"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-body-lg font-bold min-w-[40px] text-center bg-orange-50 px-3 py-1 rounded-lg border-2 border-orange-200 text-orange-800">
                      {item.quantity}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 p-0 border-orange-300 hover:border-orange-500 hover:bg-orange-100 text-orange-600 hover:text-orange-700 font-bold"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-body-lg font-bold text-slate-800">₹{Number(item.total).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Footer */}
      {cart.length > 0 && (
        <div className="border-t border-slate-200 p-6 space-y-6 bg-white/95 backdrop-blur-sm">
          <div className="space-y-3">
            <div className="flex justify-between text-body-md font-medium text-slate-700">
              <span>Subtotal</span>
              <span>₹{getTotalAmount().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-body-md font-medium text-slate-700">
              <span>Tax</span>
              <span>₹0.00</span>
            </div>
            <Separator className="my-3 bg-slate-200" />
            <div className="flex justify-between text-heading-h3 text-slate-800">
              <span>Total</span>
              <span className="text-blue-600">₹{getTotalAmount().toFixed(2)}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-button-lg py-4 h-14 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-bold border-2 border-emerald-500" 
              onClick={onCashPayment}
            >
              <Banknote className="h-5 w-5 mr-3" />
              Cash Payment
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline"
                className="h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 border-indigo-400 text-white hover:text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-button-md font-semibold" 
                onClick={onUPIPayment}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                UPI
              </Button>
              <Button 
                variant="outline"
                className="h-12 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 border-cyan-400 text-white hover:text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-button-md font-semibold" 
                onClick={onCreditPayment}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Credit
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline"
                className="h-12 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 border-teal-400 text-white hover:text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-button-md font-semibold" 
                onClick={onSplitPayment}
              >
                <SplitSquareHorizontal className="h-4 w-4 mr-2" />
                Split Payment
              </Button>
              <Button 
                variant="outline"
                className="h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 border-amber-400 text-white hover:text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-button-md font-semibold" 
                onClick={onPendingPayment}
              >
                <Clock className="h-4 w-4 mr-2" />
                Pending
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

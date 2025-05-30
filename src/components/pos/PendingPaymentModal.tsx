
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Clock, User } from "lucide-react";
import { generateBill } from "@/services/billService";
import { toast } from "sonner";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface PendingPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  cartItems: CartItem[];
  onPaymentComplete: () => void;
}

export const PendingPaymentModal: React.FC<PendingPaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  cartItems,
  onPaymentComplete,
}) => {
  const [customerName, setCustomerName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePendingPayment = async () => {
    if (!customerName.trim()) {
      toast.error("Please enter customer name");
      return;
    }

    setIsProcessing(true);
    try {
      const bill = await generateBill({
        totalAmount,
        paymentMethod: 'pending',
        cartItems,
        customerName: customerName.trim()
      });

      if (bill) {
        toast.success(`Pending payment saved for ${customerName.trim()}`);
        onPaymentComplete();
        setCustomerName("");
      }
    } catch (error) {
      console.error("Error processing pending payment:", error);
      toast.error("Failed to save pending payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setCustomerName("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Name Input */}
          <div className="space-y-2">
            <Label htmlFor="customer-name">Customer Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                id="customer-name"
                type="text"
                placeholder="Enter customer name..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
          </div>

          <Separator />

          {/* Order Summary */}
          <div className="space-y-2">
            <h3 className="font-medium">Order Summary</h3>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.name} x {item.quantity}</span>
                  <span>₹{item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total Amount:</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handlePendingPayment}
              disabled={!customerName.trim() || isProcessing}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              {isProcessing ? "Saving..." : "Save Pending Payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

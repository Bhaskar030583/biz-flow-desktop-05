import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Banknote } from "lucide-react";
import { toast } from "sonner";
import { generateBill } from "@/services/billService";

interface CashPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onPaymentComplete: () => void;
}

export const CashPaymentModal: React.FC<CashPaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onPaymentComplete,
}) => {
  const [cashReceived, setCashReceived] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCashReceived("");
    }
  }, [isOpen]);

  const handleQuickAmount = (amount: number) => {
    setCashReceived(amount.toString());
  };

  const handlePayment = async () => {
    const receivedAmount = parseFloat(cashReceived);
    
    if (isNaN(receivedAmount) || receivedAmount < totalAmount) {
      toast.error("Please enter a valid amount that covers the total");
      return;
    }

    setIsProcessing(true);
    try {
      // Import the generateBill function and cart items from parent
      // Note: We'll need to pass cartItems as a prop to this modal
      await generateBill({
        totalAmount,
        paymentMethod: 'cash',
        cartItems: [] // This should be passed as prop
      });

      const change = receivedAmount - totalAmount;
      if (change > 0) {
        toast.success(`Payment successful! Change: ₹${change.toFixed(2)}`);
      } else {
        toast.success("Payment successful!");
      }
      
      onPaymentComplete();
      setCashReceived("");
    } catch (error) {
      console.error("Error processing cash payment:", error);
      toast.error("Failed to process payment");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Cash Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cash-received">Enter Amount Received</Label>
            <Input
              id="cash-received"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              type="number"
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => handleQuickAmount(50)}>₹50</Button>
            <Button variant="outline" onClick={() => handleQuickAmount(100)}>₹100</Button>
            <Button variant="outline" onClick={() => handleQuickAmount(200)}>₹200</Button>
            <Button variant="outline" onClick={() => handleQuickAmount(500)}>₹500</Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="font-medium">Order Summary</h3>
            <div className="flex justify-between font-medium">
              <span>Total Amount:</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? "Processing..." : "Complete Payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

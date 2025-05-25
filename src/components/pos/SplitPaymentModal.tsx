
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Split, Smartphone, Banknote } from "lucide-react";
import { toast } from "sonner";
import { generateBill } from "@/services/billService";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface SplitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  cartItems: CartItem[];
  onPaymentComplete: () => void;
}

export const SplitPaymentModal: React.FC<SplitPaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  cartItems,
  onPaymentComplete,
}) => {
  const [upiAmount, setUpiAmount] = useState<string>("");
  const [cashAmount, setCashAmount] = useState<string>("");
  const [primaryMethod, setPrimaryMethod] = useState<"upi" | "cash">("upi");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUpiAmount("");
      setCashAmount("");
      setPrimaryMethod("upi");
    }
  }, [isOpen]);

  const handlePrimaryAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    const remaining = Math.max(0, totalAmount - numValue);
    
    if (primaryMethod === "upi") {
      setUpiAmount(value);
      setCashAmount(remaining > 0 ? remaining.toFixed(2) : "");
    } else {
      setCashAmount(value);
      setUpiAmount(remaining > 0 ? remaining.toFixed(2) : "");
    }
  };

  const handleQuickSplit = (upiPercent: number) => {
    const upiAmt = (totalAmount * upiPercent / 100);
    const cashAmt = totalAmount - upiAmt;
    setUpiAmount(upiAmt.toFixed(2));
    setCashAmount(cashAmt.toFixed(2));
  };

  const getTotalEntered = () => {
    return (parseFloat(upiAmount) || 0) + (parseFloat(cashAmount) || 0);
  };

  const handlePayment = async () => {
    const upiAmt = parseFloat(upiAmount) || 0;
    const cashAmt = parseFloat(cashAmount) || 0;
    const totalEntered = upiAmt + cashAmt;
    
    if (Math.abs(totalEntered - totalAmount) > 0.01) {
      toast.error("Split amounts must equal the total amount");
      return;
    }

    if (upiAmt < 0 || cashAmt < 0) {
      toast.error("Payment amounts cannot be negative");
      return;
    }

    setIsProcessing(true);
    try {
      // Generate bill with split payment details
      await generateBill({
        totalAmount,
        paymentMethod: 'upi', // We'll use UPI as primary but note the split in description
        cartItems
      });

      toast.success(`Split payment successful! UPI: ₹${upiAmt.toFixed(2)}, Cash: ₹${cashAmt.toFixed(2)}`);
      onPaymentComplete();
    } catch (error) {
      console.error("Error processing split payment:", error);
      toast.error("Failed to process split payment");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-5 w-5" />
            Split Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Choose Primary Payment Method</Label>
            <RadioGroup value={primaryMethod} onValueChange={(value) => setPrimaryMethod(value as "upi" | "cash")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upi" id="upi-primary" />
                <Label htmlFor="upi-primary" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  UPI First
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cash" id="cash-primary" />
                <Label htmlFor="cash-primary" className="flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Cash First
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="upi-amount" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                UPI Amount
              </Label>
              <Input
                id="upi-amount"
                value={upiAmount}
                onChange={(e) => {
                  if (primaryMethod === "upi") {
                    handlePrimaryAmountChange(e.target.value);
                  } else {
                    setUpiAmount(e.target.value);
                  }
                }}
                type="number"
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cash-amount" className="flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Cash Amount
              </Label>
              <Input
                id="cash-amount"
                value={cashAmount}
                onChange={(e) => {
                  if (primaryMethod === "cash") {
                    handlePrimaryAmountChange(e.target.value);
                  } else {
                    setCashAmount(e.target.value);
                  }
                }}
                type="number"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Quick Split Options</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleQuickSplit(50)}>
                50/50
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickSplit(70)}>
                70/30
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickSplit(80)}>
                80/20
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickSplit(100)}>
                UPI Only
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Amount:</span>
              <span className="font-medium">₹{totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Entered:</span>
              <span className={`font-medium ${Math.abs(getTotalEntered() - totalAmount) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{getTotalEntered().toFixed(2)}
              </span>
            </div>
            {Math.abs(getTotalEntered() - totalAmount) > 0.01 && (
              <div className="text-xs text-red-600">
                Difference: ₹{Math.abs(getTotalEntered() - totalAmount).toFixed(2)}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing || Math.abs(getTotalEntered() - totalAmount) > 0.01}
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

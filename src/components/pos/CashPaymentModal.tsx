
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Banknote, Calculator } from "lucide-react";

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
  const [amountReceived, setAmountReceived] = useState("");
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const received = parseFloat(amountReceived) || 0;
    setBalance(received - totalAmount);
  }, [amountReceived, totalAmount]);

  const handleComplete = () => {
    if (parseFloat(amountReceived) >= totalAmount) {
      onPaymentComplete();
      setAmountReceived("");
      setBalance(0);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setAmountReceived(amount.toString());
  };

  const quickAmounts = [
    totalAmount,
    Math.ceil(totalAmount / 100) * 100, // Round up to nearest 100
    Math.ceil(totalAmount / 500) * 500, // Round up to nearest 500
    Math.ceil(totalAmount / 1000) * 1000, // Round up to nearest 1000
  ].filter((amount, index, arr) => arr.indexOf(amount) === index); // Remove duplicates

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Cash Payment
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Total Amount */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Total Amount</span>
              <span className="text-2xl font-bold text-green-600">
                ₹{totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Amounts</Label>
            <div className="grid grid-cols-2 gap-2">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(amount)}
                  className="text-sm"
                >
                  ₹{amount.toFixed(0)}
                </Button>
              ))}
            </div>
          </div>

          {/* Amount Received Input */}
          <div className="space-y-2">
            <Label htmlFor="amount-received" className="text-sm font-medium">
              Amount Received
            </Label>
            <Input
              id="amount-received"
              type="number"
              placeholder="Enter amount received"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              className="text-lg"
              min="0"
              step="0.01"
            />
          </div>

          {/* Balance Display */}
          {amountReceived && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Balance to Return</span>
                <Badge 
                  variant={balance >= 0 ? "default" : "destructive"}
                  className="text-lg px-3 py-1"
                >
                  ₹{Math.abs(balance).toFixed(2)}
                  {balance < 0 && " (Insufficient)"}
                </Badge>
              </div>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!amountReceived || parseFloat(amountReceived) < totalAmount}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Complete Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

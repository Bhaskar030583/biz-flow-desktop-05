
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Banknote, Calculator } from "lucide-react";
import { generateBill } from "@/services/billService";
import { toast } from "sonner";

interface CashPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onPaymentComplete: () => void;
  cartItems: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
  }>;
  storeInfo?: {
    storeName: string;
    salespersonName: string;
  } | null;
}

export const CashPaymentModal: React.FC<CashPaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onPaymentComplete,
  cartItems,
  storeInfo
}) => {
  const [cashReceived, setCashReceived] = useState("");
  const [processing, setProcessing] = useState(false);

  const cashAmount = parseFloat(cashReceived) || 0;
  const changeAmount = cashAmount - totalAmount;

  const handlePayment = async () => {
    if (cashAmount < totalAmount) {
      toast.error("Cash received is less than total amount");
      return;
    }

    setProcessing(true);
    try {
      await generateBill({
        totalAmount,
        paymentMethod: 'cash',
        cartItems,
        storeName: storeInfo?.storeName,
        salespersonName: storeInfo?.salespersonName
      });

      toast.success("Cash payment completed and bill generated!");
      onPaymentComplete();
      setCashReceived("");
    } catch (error) {
      console.error("Error processing cash payment:", error);
      toast.error("Failed to process cash payment");
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setCashReceived("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Cash Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="total-amount">Total Amount</Label>
            <div className="text-2xl font-bold text-green-600">
              ₹{totalAmount.toFixed(2)}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cash-received">Cash Received</Label>
            <Input
              id="cash-received"
              type="number"
              step="0.01"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              placeholder="Enter cash amount"
              className="text-lg"
            />
          </div>

          {cashAmount > 0 && (
            <div className="space-y-2">
              <Label>Change to Return</Label>
              <div className={`text-xl font-bold ${changeAmount >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ₹{changeAmount.toFixed(2)}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={cashAmount < totalAmount || processing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {processing ? "Processing..." : "Complete Payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
